# Multilingual Rollout Plan

- [x] Add task checklist tracking file and keep statuses updated during implementation
- [x] Extend i18n language registry to support `de`, `en`, `zh`, `ja`
- [x] Add Chinese dictionary (`zh`) with translated core UI sections
- [x] Add Japanese dictionary (`ja`) with translated core UI sections
- [x] Update language context validation/persistence to accept `zh` and `ja`
- [x] Update Firebase auth error mapping language resolution for `zh` and `ja`
- [x] Update sidebar language selector to show four selectable languages
- [x] Add language labels (`Chinese`, `Japanese`) to dictionaries
- [x] Run production build and verify no compile errors
- [x] Mark all completed tasks in this plan

## Rollout Status

Completed: language selector now supports English, German, Chinese, and Japanese.
Notes: dictionary fallback remains enabled, so any untranslated keys fall back to German.

## French + Flag UI Tasks

- [x] Add French dictionary (`fr`) with translated core UI sections
- [x] Extend i18n registry/context/error mapping to support `fr`
- [x] Replace language dropdown with animated flag selector UI
- [x] Add French language label to dictionaries
- [x] Run production build verification
- [x] Mark French + Flag UI tasks completed

Updated rollout: English, German, French, Chinese, and Japanese are selectable via animated flag buttons.

## Page Translation Tasks

- [x] Add `pages` translation section to all dictionaries (`de`, `en`, `fr`, `zh`, `ja`)
- [x] Add `footer` translation section to all dictionaries
- [x] Migrate legal pages (Imprint/Privacy/Terms) to runtime `useLanguage()`
- [x] Migrate NotFound page to runtime `useLanguage()`
- [x] Migrate footer links to runtime `useLanguage()`
- [x] Run production build verification after page translations
