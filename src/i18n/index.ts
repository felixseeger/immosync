import { de } from './de';
import { en } from './en';
import { zh } from './zh';
import { ja } from './ja';
import { fr } from './fr';

export const dictionaries = {
  de,
  en,
  zh,
  ja,
  fr,
};

export type Language = keyof typeof dictionaries;
export type Dictionary = typeof de;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(base: T, override: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...base };
  Object.entries(override).forEach(([key, value]) => {
    const baseValue = out[key];
    if (isObject(baseValue) && isObject(value)) {
      out[key] = deepMerge(baseValue, value);
      return;
    }
    out[key] = value;
  });
  return out as T;
}

export function getDictionary(language: Language): Dictionary {
  if (language === 'de') return de;
  return deepMerge(de, dictionaries[language] ?? {});
}
