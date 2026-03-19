import { useState, useCallback } from 'react';
import type { Property } from '../types';
import { buildExposePrompt } from '../utils/exposePromptBuilder';
import { generateExposeLayout } from '../services/geminiLayoutService';
import { renderExposeLayout } from '../utils/exposeLayoutRenderer';
import type { ExposeLayout } from '../utils/exposeLayoutRenderer';

export type ExposeStep =
  | 'idle'
  | 'building-prompt'
  | 'generating-layout'
  | 'rendering-pdf'
  | 'success'
  | 'error';

interface ExposeState {
  step: ExposeStep;
  error: string | null;
  layout: ExposeLayout | null;
}

export function useExposeGeneration() {
  const [state, setState] = useState<ExposeState>({
    step: 'idle',
    error: null,
    layout: null,
  });

  const generate = useCallback(async (property: Property) => {
    try {
      // Step 1 – build prompt
      setState({ step: 'building-prompt', error: null, layout: null });
      const prompt = buildExposePrompt(property);

      // Step 2 – Gemini layout generation
      setState((s) => ({ ...s, step: 'generating-layout' }));
      const layout = await generateExposeLayout(prompt);
      setState((s) => ({ ...s, step: 'rendering-pdf', layout }));

      // Step 3 – render PDF with jsPDF
      const doc = await renderExposeLayout(layout, property);

      // Step 4 – trigger download
      const filename = `expose_${property.title?.replace(/\s+/g, '_') ?? property.id}.pdf`;
      doc.save(filename);

      setState((s) => ({ ...s, step: 'success' }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setState((s) => ({ ...s, step: 'error', error: message }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({ step: 'idle', error: null, layout: null });
  }, []);

  return { ...state, generate, reset };
}
