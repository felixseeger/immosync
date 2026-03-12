#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import prompts from "prompts";
import ora from "ora";
import chalk from "chalk";
import * as dotenv from "dotenv";
import {
  anthropicStructuredCompletion,
  generateAiImage,
  generatePollinationsImage,
  generateVoice,
  getGenerateAppExplainerImagesPrompt,
  getGenerateAppExplainerScriptPrompt,
  getGenerateImageDescriptionPrompt,
  getGenerateStoryPrompt,
  openaiStructuredCompletion,
  setAnthropicApiKey,
  setApiKey,
} from "./service";
import {
  ContentItemWithDetails,
  StoryMetadataWithDetails,
  StoryScript,
  StoryWithImages,
  Timeline,
} from "../src/lib/types";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import { createTimeLineFromStoryWithDetails } from "./timeline";

dotenv.config({ quiet: true });

interface GenerateOptions {
  apiKey?: string;
  elevenlabsApiKey?: string;
  title?: string;
  topic?: string;
}

class ContentFS {
  title: string;
  slug: string;

  constructor(title: string) {
    this.title = title;
    this.slug = this.getSlug();
  }

  saveDescriptor(descriptor: StoryMetadataWithDetails) {
    const dirPath = this.getDir();
    const filePath = path.join(dirPath, "descriptor.json");
    fs.writeFileSync(filePath, JSON.stringify(descriptor, null, 2));
  }

  saveTimeline(timeline: Timeline) {
    const dirPath = this.getDir();
    const filePath = path.join(dirPath, "timeline.json");
    fs.writeFileSync(filePath, JSON.stringify(timeline, null, 2));
  }

  getDir(dir?: string): string {
    const segments = ["public", "content", this.slug];
    if (dir) {
      segments.push(dir);
    }
    const p = path.join(process.cwd(), ...segments);
    fs.mkdirSync(p, { recursive: true });
    return p;
  }

  getImagePath(uid: string): string {
    const dirPath = this.getDir("images");
    return path.join(dirPath, `${uid}.png`);
  }

  getAudioPath(uid: string): string {
    const dirPath = this.getDir("audio");
    return path.join(dirPath, `${uid}.mp3`);
  }

  getSlug(): string {
    return this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

async function generateStory(options: GenerateOptions) {
  try {
    let apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    let elevenlabsApiKey =
      options.elevenlabsApiKey || process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      const response = await prompts({
        type: "password",
        name: "apiKey",
        message: "Enter your OpenAI API key:",
        validate: (value) => value.length > 0 || "API key is required",
      });

      if (!response.apiKey) {
        console.log(chalk.red("API key is required. Exiting..."));
        process.exit(1);
      }

      apiKey = response.apiKey;
    }

    if (!elevenlabsApiKey) {
      const response = await prompts({
        type: "password",
        name: "elevenlabsApiKey",
        message: "Enter your ElevenLabs API key:",
        validate: (value) =>
          value.length > 0 || "ElevenLabs API key is required",
      });

      if (!response.elevenlabsApiKey) {
        console.log(chalk.red("API key is required. Exiting..."));
        process.exit(1);
      }

      elevenlabsApiKey = response.elevenlabsApiKey;
    }

    let { title, topic } = options;

    if (!title || !topic) {
      const response = await prompts([
        {
          type: "text",
          name: "title",
          message: "Title of the story:",
          initial: title,
          validate: (value) => value.length > 0 || "Title is required",
        },
        {
          type: "text",
          name: "topic",
          message: "Topic of the story:",
          initial: topic,
          validate: (value) => value.length > 0 || "Topic is required",
        },
      ]);

      if (!response.title || !response.topic) {
        console.log(chalk.red("Title and topic are required. Exiting..."));
        process.exit(1);
      }

      title = response.title;
      topic = response.topic;
    }

    console.log(chalk.blue(`\n📖 Creating story: "${title}"`));
    console.log(chalk.blue(`📝 Topic: ${topic}\n`));

    const storyWithDetails: StoryMetadataWithDetails = {
      shortTitle: title!,
      content: [],
    };

    const storySpinner = ora("Generating story...").start();
    setApiKey(apiKey!);
    const storyRes = await openaiStructuredCompletion(
      getGenerateStoryPrompt(title!, topic!),
      StoryScript,
    );
    storySpinner.succeed(chalk.green("Story generated!"));

    const descriptionsSpinner = ora("Generating image descriptions...").start();
    const storyWithImagesRes = await openaiStructuredCompletion(
      getGenerateImageDescriptionPrompt(storyRes.text),
      StoryWithImages,
    );
    descriptionsSpinner.succeed(chalk.green("Image descriptions generated!"));

    for (const item of storyWithImagesRes.result) {
      const contentWithDetails: ContentItemWithDetails = {
        text: item.text,
        imageDescription: item.imageDescription,
        uid: uuidv4(),
        audioTimestamps: {
          characters: [],
          characterStartTimesSeconds: [],
          characterEndTimesSeconds: [],
        },
      };

      storyWithDetails.content.push(contentWithDetails);
    }

    const contentFs = new ContentFS(title!);
    contentFs.saveDescriptor(storyWithDetails);

    const imagesSpinner = ora("Generating images and voice...").start();
    for (let i = 0; i < storyWithDetails.content.length; i++) {
      const storyItem = storyWithDetails.content[i];
      imagesSpinner.text = `[${i * 2 + 1}/${storyWithDetails.content.length * 2}] Generating image for ${storyItem.text}`;
      await generateAiImage({
        prompt: storyItem.imageDescription,
        path: contentFs.getImagePath(storyItem.uid),
        onRetry: (attempt) => {
          imagesSpinner.text = `[${i * 2 + 1}/${storyWithDetails.content.length * 2}] Generating image for ${storyItem.text} (retry ${attempt + 1})`;
        },
      });
      imagesSpinner.text = `[${i * 2 + 2}/${storyWithDetails.content.length * 2}] Generating voice for ${storyItem.text}`;
      const timings = await generateVoice(
        storyItem.text,
        elevenlabsApiKey!,
        contentFs.getAudioPath(storyItem.uid),
      );
      storyItem.audioTimestamps = timings;
    }
    contentFs.saveDescriptor(storyWithDetails);
    imagesSpinner.succeed(chalk.green("Images generated!"));

    const finalSpinner = ora("Generating final result...").start();
    const timeline = createTimeLineFromStoryWithDetails(storyWithDetails);
    contentFs.saveTimeline(timeline);
    finalSpinner.succeed(chalk.green("Final result generated!"));

    console.log(chalk.green.bold("\n✨ Story generation complete!\n"));
    console.log("Run " + chalk.blue("npm run dev") + " to preview the story");

    return {};
  } catch (error) {
    console.error(chalk.red("\n❌ Error:"), error);
    process.exit(1);
  }
}

const SITESYNC_APP_DESCRIPTION = `
SiteSync is an all-in-one real-estate CRM built for modern property agents and agencies.

Key features:
- Property management: create listings with full details (description, location, features), upload multiple images with a drag-and-drop reorderable gallery, attach videos, and toggle a live public portfolio page for each property.
- Deals pipeline: track deals through stages with a Kanban-style board, add notes, and link deals to contacts and properties.
- Contacts: manage buyers, sellers, and landlords with full contact history and linked activity.
- Calendar & Viewings: schedule property viewings directly on a visual calendar, edit or delete them, and keep all viewing history on the property record.
- Activity stream: see a real-time feed of every action taken across properties, deals, and contacts.
- Dashboard: at-a-glance stats for properties, deals, and upcoming viewings.
- Global search: instantly find any property, deal, or contact from anywhere in the app.
- Authentication: secure sign-in with password reset flow.
- Custom domain support for client-facing portfolio pages.
`;

interface ExplainOptions {
  anthropicApiKey?: string;
  elevenlabsApiKey?: string;
}

async function generateAppExplainer(options: ExplainOptions) {
  try {
    let anthropicKey = options.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    let elevenlabsApiKey =
      options.elevenlabsApiKey || process.env.ELEVENLABS_API_KEY;

    if (!anthropicKey) {
      const response = await prompts({
        type: "password",
        name: "anthropicApiKey",
        message: "Enter your Anthropic API key:",
        validate: (value) => value.length > 0 || "API key is required",
      });
      if (!response.anthropicApiKey) {
        console.log(chalk.red("API key is required. Exiting..."));
        process.exit(1);
      }
      anthropicKey = response.anthropicApiKey;
    }

    if (!elevenlabsApiKey) {
      const response = await prompts({
        type: "password",
        name: "elevenlabsApiKey",
        message: "Enter your ElevenLabs API key:",
        validate: (value) =>
          value.length > 0 || "ElevenLabs API key is required",
      });
      if (!response.elevenlabsApiKey) {
        console.log(chalk.red("API key is required. Exiting..."));
        process.exit(1);
      }
      elevenlabsApiKey = response.elevenlabsApiKey;
    }

    const title = "SiteSync";

    console.log(chalk.blue("\n🏠 Generating SiteSync app explainer video...\n"));
    console.log(chalk.dim("  Text: Claude (Anthropic)  |  Images: Pollinations.ai (free)  |  Voice: ElevenLabs\n"));

    setAnthropicApiKey(anthropicKey!);

    const scriptSpinner = ora("Writing voiceover script...").start();
    const scriptRes = await anthropicStructuredCompletion(
      getGenerateAppExplainerScriptPrompt(SITESYNC_APP_DESCRIPTION),
      StoryScript,
    );
    scriptSpinner.succeed(chalk.green("Script written!"));

    const imagesPromptSpinner = ora("Planning visuals...").start();
    const storyWithImagesRes = await anthropicStructuredCompletion(
      getGenerateAppExplainerImagesPrompt(scriptRes.text),
      StoryWithImages,
    );
    imagesPromptSpinner.succeed(chalk.green("Visuals planned!"));

    const storyWithDetails: StoryMetadataWithDetails = {
      shortTitle: title,
      content: storyWithImagesRes.result.map((item) => ({
        text: item.text,
        imageDescription: item.imageDescription,
        uid: uuidv4(),
        audioTimestamps: {
          characters: [],
          characterStartTimesSeconds: [],
          characterEndTimesSeconds: [],
        },
      })),
    };

    const contentFs = new ContentFS(title);
    contentFs.saveDescriptor(storyWithDetails);

    const mediaSpinner = ora("Generating images and voice...").start();
    for (let i = 0; i < storyWithDetails.content.length; i++) {
      const item = storyWithDetails.content[i];
      mediaSpinner.text = `[${i * 2 + 1}/${storyWithDetails.content.length * 2}] Image (Pollinations): ${item.text.slice(0, 40)}...`;
      await generatePollinationsImage({
        prompt: item.imageDescription,
        path: contentFs.getImagePath(item.uid),
        onRetry: (attempt) => {
          mediaSpinner.text = `[${i * 2 + 1}/${storyWithDetails.content.length * 2}] Image retry ${attempt + 1}: ${item.text.slice(0, 40)}...`;
        },
      });
      mediaSpinner.text = `[${i * 2 + 2}/${storyWithDetails.content.length * 2}] Voice: ${item.text.slice(0, 40)}...`;
      const timings = await generateVoice(
        item.text,
        elevenlabsApiKey!,
        contentFs.getAudioPath(item.uid),
      );
      item.audioTimestamps = timings;
    }
    contentFs.saveDescriptor(storyWithDetails);
    mediaSpinner.succeed(chalk.green("Images and voice generated!"));

    const finalSpinner = ora("Building timeline...").start();
    const timeline = createTimeLineFromStoryWithDetails(storyWithDetails);
    contentFs.saveTimeline(timeline);
    finalSpinner.succeed(chalk.green("Timeline ready!"));

    console.log(chalk.green.bold("\n✨ App explainer video generated!\n"));
    console.log("Run " + chalk.blue("npm run dev") + " to preview it in Remotion Studio");

    return {};
  } catch (error) {
    console.error(chalk.red("\n❌ Error:"), error);
    process.exit(1);
  }
}

yargs(hideBin(process.argv))
  .command(
    "generate",
    "Generate story timeline for given title and topic",
    (yargs) => {
      return yargs
        .option("api-key", {
          alias: "k",
          type: "string",
          description: "OpenAI API key",
        })
        .option("title", {
          alias: "t",
          type: "string",
          description: "Title of the story",
        })
        .option("topic", {
          alias: "p",
          type: "string",
          description:
            "Topic of the story (e.g. Interesting Facts, History, etc.)",
        });
    },
    async (argv) => {
      await generateStory({
        apiKey: argv["api-key"],
        title: argv.title,
        topic: argv.topic,
      });
    },
  )
  .command(
    "$0",
    "Generate a story (default command)",
    (yargs) => {
      return yargs
        .option("api-key", {
          alias: "k",
          type: "string",
          description: "OpenAI API key",
        })
        .option("title", {
          alias: "t",
          type: "string",
          description: "Title of the story",
        })
        .option("topic", {
          alias: "p",
          type: "string",
          description:
            "Topic of the story (e.g. Interesting Facts, History, etc.)",
        });
    },
    async (argv) => {
      await generateStory({
        apiKey: argv["api-key"],
        title: argv.title,
        topic: argv.topic,
      });
    },
  )
  .command(
    "explain",
    "Generate a SiteSync app explainer video",
    (yargs) => {
      return yargs
        .option("anthropic-api-key", {
          alias: "a",
          type: "string",
          description: "Anthropic API key (for Claude)",
        })
        .option("elevenlabs-api-key", {
          alias: "e",
          type: "string",
          description: "ElevenLabs API key",
        });
    },
    async (argv) => {
      await generateAppExplainer({
        anthropicApiKey: argv["anthropic-api-key"],
        elevenlabsApiKey: argv["elevenlabs-api-key"],
      });
    },
  )
  .demandCommand(0, 1)
  .help()
  .alias("help", "h")
  .version()
  .alias("version", "v")
  .strict()
  .parse();
