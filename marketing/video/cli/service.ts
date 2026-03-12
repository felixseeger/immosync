import z from "zod";
import * as fs from "fs";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { CharacterAlignmentResponseModel } from "@elevenlabs/elevenlabs-js/api";
import { IMAGE_HEIGHT, IMAGE_WIDTH } from "../src/lib/constants";

let apiKey: string | null = null;
let anthropicApiKey: string | null = null;

export const setApiKey = (key: string) => {
  apiKey = key;
};

export const setAnthropicApiKey = (key: string) => {
  anthropicApiKey = key;
};

// ── OpenAI structured completion ────────────────────────────────────────────

export const openaiStructuredCompletion = async <T>(
  prompt: string,
  schema: z.ZodType<T>,
): Promise<T> => {
  const jsonSchema = z.toJSONSchema(schema);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "response",
          schema: {
            type: jsonSchema.type || "object",
            properties: jsonSchema.properties,
            required: jsonSchema.required,
            additionalProperties: jsonSchema.additionalProperties ?? false,
          },
          strict: true,
        },
      },
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${await res.text()}`);

  const data = await res.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  const parsed = JSON.parse(content);
  return schema.parse(parsed);
};

// ── Anthropic Claude structured completion ───────────────────────────────────

export const anthropicStructuredCompletion = async <T>(
  prompt: string,
  schema: z.ZodType<T>,
): Promise<T> => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicApiKey!,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content:
            prompt +
            "\n\nIMPORTANT: Respond with valid JSON only. No explanation, no markdown fences.",
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic error: ${await res.text()}`);

  const data = await res.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error("No content in Anthropic response");
  }

  // Strip markdown fences if present
  const json = content.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const parsed = JSON.parse(json);
  return schema.parse(parsed);
};

// ── Image generation ─────────────────────────────────────────────────────────

function saveUint8ArrayToPng(uint8Array: Uint8Array, filePath: string) {
  const buffer = Buffer.from(uint8Array);
  fs.writeFileSync(filePath, buffer as Uint8Array);
}

export const generateAiImage = async ({
  prompt,
  path,
  onRetry,
}: {
  prompt: string;
  path: string;
  onRetry: (attempt: number) => void;
}) => {
  const maxRetries = 3;
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        size: `${IMAGE_WIDTH}x${IMAGE_HEIGHT}`,
        response_format: "b64_json",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const buffer = Buffer.from(data.data[0].b64_json, "base64");
      const uint8Array = new Uint8Array(buffer);
      saveUint8ArrayToPng(uint8Array, path);
      return;
    } else {
      lastError = new Error(
        `OpenAI error (attempt ${attempt + 1}): ${await res.text()}`,
      );
      attempt++;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      onRetry(attempt);
    }
  }

  throw lastError!;
};

// Free image generation via Pollinations.ai (no API key required)
export const generatePollinationsImage = async ({
  prompt,
  path,
  onRetry,
}: {
  prompt: string;
  path: string;
  onRetry: (attempt: number) => void;
}) => {
  const maxRetries = 3;
  let attempt = 0;
  let lastError: Error | null = null;

  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${IMAGE_WIDTH}&height=${IMAGE_HEIGHT}&nologo=true&model=flux`;

  while (attempt < maxRetries) {
    const res = await fetch(url);

    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      saveUint8ArrayToPng(uint8Array, path);
      return;
    } else {
      lastError = new Error(
        `Pollinations error (attempt ${attempt + 1}): ${res.status} ${res.statusText}`,
      );
      attempt++;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      onRetry(attempt);
    }
  }

  throw lastError!;
};

// ── Prompt builders ──────────────────────────────────────────────────────────

export const getGenerateStoryPrompt = (title: string, topic: string) => {
  const prompt = `Write a short story with title [${title}] (its topic is [${topic}]).
   You must follow best practices for great storytelling.
   The script must be 8-10 sentences long.
   Story events can be from anywhere in the world, but text must be translated into English language.
   Result result without any formatting and title, as one continuous text.
   Skip new lines.`;

  return prompt;
};

export const getGenerateAppExplainerScriptPrompt = (appDescription: string) => {
  return `You are a professional video scriptwriter specialising in SaaS product explainer videos.
Write a compelling voiceover script for a short-form vertical video (TikTok / Instagram Reels style) that explains the following app:

<app>
${appDescription}
</app>

Rules:
- 8-10 sentences, each punchy and self-contained (15-20 words max per sentence).
- Open with a relatable pain point real-estate agents face.
- Walk through 4-5 key features naturally, as if narrating what is happening on screen.
- End with a strong call-to-action (e.g. "Try SiteSync free today").
- Write in second person ("you", "your").
- No hashtags, emojis, or formatting. Plain text only, all on one line.

Return JSON: { "text": "<full script as one string>" }`;
};

export const getGenerateAppExplainerImagesPrompt = (scriptText: string) => {
  return `You are a creative director for a real-estate SaaS product video.
Given the voiceover script below, generate 6-8 detailed image descriptions — one per sentence group.

Each image must be:
- A clean, modern, photorealistic UI mockup or lifestyle scene that matches the script line(s).
- Shot in portrait/vertical orientation (9:16).
- Visually varied (mix of device close-ups, aerial property shots, dashboard screens, agent-client meetings).
- Bright, professional, and aspirational.

Return JSON only — an array:
[
  { "text": "exact script sentence(s)", "imageDescription": "very detailed image prompt" }
]

<script>
${scriptText}
</script>`;
};

export const getGenerateImageDescriptionPrompt = (storyText: string) => {
  const prompt = `You are given story text.
  Generate (in English) 5-8 very detailed image descriptions  for this story.
  Return their description as json array with story sentences matched to images.
  Story sentences must be in the same order as in the story and their content must be preserved.
  Each image must match 1-2 sentence from the story.
  Images must show story content in a way that is visually appealing and engaging, not just characters.
  Give output in json format:

  [
    {
      "text": "....",
      "imageDescription": "..."
    }
  ]

  <story>
  ${storyText}
  </story>`;

  return prompt;
};

// ── Voice generation ─────────────────────────────────────────────────────────

const saveBase64ToMp3 = (data: string, path: string) => {
  const buffer = Buffer.from(data, "base64");
  fs.writeFileSync(path, buffer as Uint8Array);
};

export const generateVoice = async (
  text: string,
  apiKey: string,
  path: string,
): Promise<CharacterAlignmentResponseModel> => {
  const client = new ElevenLabsClient({
    environment: "https://api.elevenlabs.io",
    apiKey,
  });

  const voiceId = "21m00Tcm4TlvDq8ikWAM";

  const data = await client.textToSpeech.convertWithTimestamps(voiceId, {
    text,
  });

  if (!data.alignment || !data.alignment.characterEndTimesSeconds.length) {
    throw new Error("ElevenLabs response missing timestamps");
  }

  saveBase64ToMp3(data.audioBase64, path);
  return data.alignment;
};
