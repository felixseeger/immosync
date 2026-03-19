import { GoogleGenAI, Modality } from '@google/genai';

// ---------------------------------------------------------------------------
// Typed error
// ---------------------------------------------------------------------------
export class GeminiImageError extends Error {
  constructor(
    message: string,
    public readonly code: 'NO_API_KEY' | 'API_ERROR' | 'NO_IMAGE' | 'RATE_LIMIT' | 'UNKNOWN',
  ) {
    super(message);
    this.name = 'GeminiImageError';
  }
}

// ---------------------------------------------------------------------------
// Core image generation
// ---------------------------------------------------------------------------

/**
 * Generate a PNG image via Gemini Imagen 3 (Nanobana).
 * Returns a base64 data URL: "data:image/png;base64,..."
 */
export async function generateReportImage(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new GeminiImageError(
      'Gemini API key is not configured. Set GEMINI_API_KEY in .env.local.',
      'NO_API_KEY',
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  let response;
  try {
    response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '16:9',
      },
    });
  } catch (err: unknown) {
    // Rate limit
    if (err instanceof Error && err.message.includes('429')) {
      throw new GeminiImageError(
        'Too many requests to Gemini API. Please wait a moment and try again.',
        'RATE_LIMIT',
      );
    }
    throw new GeminiImageError(
      `Gemini API call failed: ${err instanceof Error ? err.message : String(err)}`,
      'API_ERROR',
    );
  }

  const imageData = response.generatedImages?.[0]?.image?.imageBytes;

  if (!imageData) {
    throw new GeminiImageError(
      'Gemini returned no image data. The prompt may have been blocked or the model is unavailable.',
      'NO_IMAGE',
    );
  }

  // imageBytes is a base64 string
  return `data:image/png;base64,${imageData}`;
}
