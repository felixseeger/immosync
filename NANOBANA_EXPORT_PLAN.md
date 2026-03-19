# 🧠 Nanobana Image Export — Implementation Plan
### Feature: AI-Generated Report Image via Gemini on "Export Report" click
**Project:** ImmoSync (`sitesync`)  
**Prepared by:** OpenClaw  
**Date:** 2025

---

## 🎯 Goal

When the user clicks **"Export Report"** on the Dashboard, instead of (or in addition to) downloading a raw JSON blob, we use **Nanobana** (Gemini Imagen via `@google/genai`) to generate a **visual summary image** of the current dashboard report data — a branded, data-driven infographic card — and offer it as a downloadable PNG.

---

## 🔍 What We Have Today

### Current `handleExportReport()` in `Dashboard.tsx`:
```ts
const report = {
  exportedAt: new Date().toISOString(),
  activeListings,
  contactsCount,
  portfolioValue,
  totalProperties: properties.length,
  byStatus: {
    Active: properties.filter(p => p.status === 'Active').length,
    Pending: properties.filter(p => p.status === 'Pending').length,
    Sold:    properties.filter(p => p.status === 'Sold').length,
  },
};
// → downloads as JSON blob
```

### Available Report Data:
| Field               | Source                        |
|---------------------|-------------------------------|
| `activeListings`    | Firestore properties          |
| `contactsCount`     | Firestore contacts            |
| `portfolioValue`    | Sum of active property prices |
| `totalProperties`   | Firestore properties          |
| `byStatus`          | Active / Pending / Sold count |
| `activeDealsCount`  | Deals not in `closed` stage   |
| `newLeadsCount`     | Deals in `lead` stage         |
| `todayViewings`     | Viewings scheduled today      |
| `exportedAt`        | Timestamp                     |

### Gemini Config:
- **Key:** `GEMINI_API_KEY` in `.env.local` (exposed via `vite.config.ts` as `process.env.GEMINI_API_KEY`)  
- **SDK:** `@google/genai` already in `dependencies`  
- **Model target:** `imagen-3.0-generate-002` (Nanobana / Imagen 3)

---

## 🏗️ Architecture

```
Dashboard.tsx
    │
    │ click "Export Report"
    ▼
useReportExport() hook          ← new hook
    │
    ├─ builds ReportData object
    ├─ builds rich text prompt  ← promptBuilder.ts (new)
    │
    ▼
geminiImageService.ts           ← new service
    │
    │  GoogleGenAI → imagen-3.0-generate-002
    ▼
base64 PNG response
    │
    ▼
ExportReportModal.tsx           ← new modal component
    │  shows preview + download button
    │  + optional JSON download toggle
    ▼
user downloads immosync-report-YYYY-MM-DD.png
```

---

## 📁 Files to Create / Modify

### 🆕 New Files

#### 1. `src/services/geminiImageService.ts`
Wraps `@google/genai` Imagen call.  
- Input: `prompt: string`  
- Output: `Promise<string>` (base64 PNG data URL)  
- Uses `process.env.GEMINI_API_KEY`  
- Model: `imagen-3.0-generate-002`  
- Output format: `image/png`, 1:1 or 16:9 aspect ratio  
- Error handling: throws typed `GeminiImageError`

#### 2. `src/utils/reportPromptBuilder.ts`
Builds the Nanobana image generation prompt from report data.  
- Input: `ReportSnapshot` interface  
- Output: `string` — rich, structured prompt  
- Prompt style: **modern dark real estate dashboard infographic card**, ImmoSync brand, includes all KPIs as visual layout description  
- Keeps prompt under 1000 chars (Imagen sweet spot)

#### 3. `src/hooks/useReportExport.ts`
Custom React hook — orchestrates the whole flow.  
- Collects all live dashboard data  
- Calls `reportPromptBuilder`  
- Calls `geminiImageService`  
- Returns `{ generate, isGenerating, imageDataUrl, error, reset }`  
- Keeps JSON export logic too (both outputs available)

#### 4. `src/components/ExportReportModal.tsx`
Modal UI shown after clicking "Export Report":
- **Loading state:** spinner + "Generating your report image…" copy  
- **Success state:**
  - Previews the generated PNG (full-width in modal)
  - "Download Image" button → triggers PNG download  
  - "Download JSON" button → downloads raw data (existing behavior)  
  - "Regenerate" button → re-runs generation  
- **Error state:** error message + retry + fallback to JSON-only  
- Animated with `motion/react` (consistent with app)  
- Glassmorphism `glass` class (consistent with app design)

---

### ✏️ Modified Files

#### 5. `src/components/Dashboard.tsx`
- Import `useReportExport` hook  
- Import `ExportReportModal`  
- Add `showExportModal` state  
- Replace current `handleExportReport` download-JSON logic with: open modal → trigger generation  
- Pass report data + modal state to hook + modal component

---

## 🔤 Prompt Strategy (Nanobana)

The prompt passed to Imagen 3 will describe a **branded infographic card** — not a photo. Example structure:

```
A sleek, dark-mode real estate dashboard report card for ImmoSync.
Modern UI design, glassmorphism, deep navy background with subtle blue accents.
Display the following KPIs in a clean typographic layout:
- Active Listings: {activeListings}
- Total Contacts: {contactsCount}  
- Portfolio Value: €{portfolioValue}
- Active Deals: {activeDealsCount}
- New Leads: {newLeadsCount}
- Properties: {totalProps} total ({active} active, {pending} pending, {sold} sold)
- Today's Viewings: {todayViewings}
- Generated: {date}
Footer: "ImmoSync — Real Estate Intelligence"
Style: futuristic, minimalist, data-rich infographic, no people, no photography.
```

This generates a **visually branded, data-infused summary image** — ready for presentations, emails, or client reports.

---

## 🔄 User Flow (Step by Step)

```
1. User is on Dashboard
2. User clicks "Export Report" button
3. ExportReportModal opens immediately (loading state)
4. useReportExport hook fires:
   a. Collects live data snapshot
   b. Builds prompt via reportPromptBuilder
   c. Calls geminiImageService → Imagen 3 API
5. [~3–8 seconds] Image returns as base64 PNG
6. Modal shows image preview
7. User clicks:
   → "Download Image" → saves PNG to device
   → "Download JSON" → saves raw JSON (existing behavior)
   → "Regenerate" → re-fires generation
8. User closes modal
```

---

## ⚠️ Edge Cases & Handling

| Scenario | Handling |
|---|---|
| API key missing | Show clear error: "Gemini API key not configured" |
| Imagen API error / quota | Show error state + fallback to JSON download only |
| Empty data (no properties) | Still generate — prompt reflects "0 listings" |
| Slow network | Loading state with animated spinner for up to 30s |
| User closes mid-generation | Cancel-safe — modal unmount stops display, hook resets |
| Rate limit | Catch 429 → "Too many requests, try again shortly" |

---

## 🧩 Type Definitions

```ts
// New shared type
export interface ReportSnapshot {
  exportedAt: string;
  activeListings: number;
  contactsCount: number;
  portfolioValue: number;
  totalProperties: number;
  activeDealsCount: number;
  newLeadsCount: number;
  todayViewingsCount: number;
  byStatus: {
    Active: number;
    Pending: number;
    Sold: number;
  };
}
```

---

## 📦 No New Dependencies Needed

| Package | Status |
|---|---|
| `@google/genai` | ✅ Already in `package.json` |
| `motion/react` | ✅ Already in `package.json` |
| `lucide-react` | ✅ Already in `package.json` |

---

## 🚀 Implementation Order

```
Step 1 → src/services/geminiImageService.ts
Step 2 → src/utils/reportPromptBuilder.ts  
Step 3 → src/hooks/useReportExport.ts
Step 4 → src/components/ExportReportModal.tsx
Step 5 → src/components/Dashboard.tsx  (wire it all up)
```

---

## ✅ Done Criteria

- [ ] Clicking "Export Report" opens modal immediately
- [ ] Imagen 3 call fires with correct data-filled prompt
- [ ] Generated PNG previews in modal
- [ ] PNG downloads correctly named `immosync-report-YYYY-MM-DD.png`
- [ ] JSON download still works (parity with current behavior)
- [ ] Error states handled gracefully
- [ ] Loading/success/error animations match app design system
- [ ] Works in both dark and light mode
- [ ] No TypeScript errors (`tsc --noEmit` passes)
