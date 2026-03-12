# CLAUDE.md – Frontend Website Rules

## Always Do First
- Invoke the `frontend-design` skill before writing any frontend code, every session.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do not stop until it matches.

## Local Server
- Always serve on localhost – never screenshot a file:/// URL.
- Start the dev server: node serve.mjs (serves the project root at http://localhost).
- If the server is already running, do not start a second instance.

## Screenshot Workflow
- Use Playwright MCP for taking screenshots in browser.
- Screenshots are saved automatically to ./temporary screenshots/screenshot-N.png (auto increments N).
- Optional label suffix: node screenshot.mjs http://localhost:3000 label → saves as screenshot-label.png.
- After screenshotting, read the PNG from temporary screenshots/ with the Read tool.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px".
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border radius, text transforms.


