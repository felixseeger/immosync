import { GoogleGenAI } from '@google/genai';
import type { ExposeLayout } from '../utils/exposeLayoutRenderer';

// ---------------------------------------------------------------------------
// Typed error
// ---------------------------------------------------------------------------
export class GeminiLayoutError extends Error {
  constructor(
    message: string,
    public readonly code: 'NO_API_KEY' | 'API_ERROR' | 'PARSE_ERROR' | 'RATE_LIMIT' | 'UNKNOWN',
  ) {
    super(message);
    this.name = 'GeminiLayoutError';
  }
}

// ---------------------------------------------------------------------------
// Core layout generation
// ---------------------------------------------------------------------------

/**
 * Send a prompt to Gemini 2.0 Flash and get back a structured JSON layout
 * for a property exposé.  Uses `responseMimeType: 'application/json'` so the
 * model is forced to return valid JSON matching the ExposeLayout shape.
 */
export async function generateExposeLayout(prompt: string): Promise<ExposeLayout> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new GeminiLayoutError(
      'Gemini API key is not configured. Set GEMINI_API_KEY in .env.local.',
      'NO_API_KEY',
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('429')) {
      throw new GeminiLayoutError(
        'Too many requests to Gemini API. Please wait a moment and try again.',
        'RATE_LIMIT',
      );
    }
    throw new GeminiLayoutError(
      `Gemini API call failed: ${err instanceof Error ? err.message : String(err)}`,
      'API_ERROR',
    );
  }

  const raw = response?.text;

  if (!raw) {
    throw new GeminiLayoutError(
      'Gemini returned no content. The prompt may have been blocked.',
      'API_ERROR',
    );
  }

  try {
    const layout: ExposeLayout = JSON.parse(raw);
    // Basic shape validation
    if (!layout.pages || !Array.isArray(layout.pages) || layout.pages.length === 0) {
      throw new Error('Layout must contain at least one page');
    }
    if (!layout.colorScheme) {
      throw new Error('Layout must contain a colorScheme');
    }
    return layout;
  } catch (err: unknown) {
    throw new GeminiLayoutError(
      `Failed to parse layout JSON: ${err instanceof Error ? err.message : String(err)}`,
      'PARSE_ERROR',
    );
  }
}
