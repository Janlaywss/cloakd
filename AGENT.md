# AGENT.md — cloakd

Context file for AI coding assistants (Claude Code, Cursor, Copilot, etc.) working on this project. Read this before making changes.

## What this is

Cloakd is a [Plasmo](https://plasmo.com) browser extension that reskins ChatGPT (`chatgpt.com`) to look and feel like Claude.ai: warm cream palette, copper accent, Anthropic Sans / Serif fonts, rounded bubbles, serif assistant responses, matching hover/active states. Gemini support is on the roadmap but not built yet.

The approach is **CSS-only**. No DOM mutation, no React injection, no observer crawling message nodes. A single content script injects a `<style>` tag at `document_start` and relies on ChatGPT's own CSS variables + selector overrides to reshape the UI. A tiny `MutationObserver` watches `<html>` in case ChatGPT's SPA router replaces `<head>`, and re-injects the style tag if it disappears.

## Project layout

```
cloakd/
├── package.json                    Plasmo 0.88 + sharp 0.33 override (see Gotchas)
├── tsconfig.json                   extends plasmo/templates/tsconfig.base, ~* alias
├── assets/
│   ├── icon.png                    512×512 placeholder (Claude copper)
│   └── fonts/
│       ├── anthropic-sans.woff2    117KB, Regular 400 — from Claude.ai CDN
│       └── anthropic-serif.woff2   164KB, Regular 400 — from Claude.ai CDN
├── contents/
│   └── chatgpt.ts                  content script: injects @font-face + CSS at document_start
└── styles/
    └── chatgpt/
        ├── base.css                shared tokens (typography/geometry/motion) + ALL selectors
        ├── light.css               :root { …light color/shadow tokens… }
        └── dark.css                html.dark { …dark color/shadow tokens… }
```

## How theming works

Three CSS files, concatenated and injected as one `<style id="cloakd-chatgpt-style">`:

1. **light.css** — defines `--cloakd-*` color/surface/shadow tokens on `:root` (the default).
2. **dark.css** — overrides the same tokens inside `html.dark, :root[data-theme="dark"]`.
3. **base.css** — declares theme-agnostic tokens (fonts, radii, transitions) and ALL selector overrides. Every declaration uses `var(--cloakd-*)` — no magic values.

ChatGPT itself uses CSS variables on `html` (`--main-surface-primary`, `--text-primary`, `--sidebar-surface-*`, `--border-*`, etc.). `base.css` re-pipes those into the `--cloakd-*` tokens, so Tailwind components automatically pick up the new colors without per-class overrides. This is the cheapest, most robust override strategy.

The content script concatenates in this order: `fontFaceCSS + lightCSS + darkCSS + baseCSS`. Order is cosmetic only — CSS custom properties resolve at compute time.

## Design principles

1. **No magic values in base.css.** Every color, shadow, radius, font must come through a token. If you need a new token, add it to **both** `light.css` and `dark.css` with appropriate values.
2. **Tokens follow Claude.ai's names exactly.** `--font-ui`, `--font-ui-serif`, `--font-user-message`, `--font-claude-response`, `--font-anthropic-sans/serif/mono`, `--font-sans-serif`, `--font-serif`, `--font-system`, `--font-dyslexia` mirror Claude.ai's own CSS. Don't rename.
3. **Graceful font degradation.** The inlined @font-face has only Regular (400). Bold / italic / CJK fall through the tails of `--font-anthropic-sans` and `--font-anthropic-serif` (system-ui for sans, Georgia + full CJK family chain for serif). `font-synthesis: none` on `html, body` prevents ugly faux-bold from Chrome's synthesizer.
4. **Semantic selectors over Tailwind classes.** Prefer `[data-message-author-role="user"]`, `#prompt-textarea`, `[role="dialog"]` over `.rounded-3xl` or `.bg-token-*`. ChatGPT rebuilds class names and adds/removes Tailwind variants frequently; attribute-based selectors survive refactors better. Class-attribute substring matches like `[class*="rounded-3xl"]` are used only as last-resort fallbacks.
5. **No DOM touching.** This extension never calls `querySelector`/`createElement` against ChatGPT's DOM. If you're tempted to mutate structure, first see if a CSS pseudo-element + `content:` or a clever selector can do the job.

## Commands

```sh
pnpm install           # ~9s — sharp 0.33 ships prebuilt binaries, no GitHub libvips fetch
pnpm dev               # watch mode, rebuilds bundle on file save
pnpm build             # production bundle → build/chrome-mv3-prod/
pnpm package           # zipped package (for manual distribution)
```

Load the extension: `chrome://extensions` → Developer mode → Load unpacked → `build/chrome-mv3-dev` (for dev) or `build/chrome-mv3-prod` (for build). After changing CSS, click the **refresh** icon on the Cloakd card and hard-refresh `chatgpt.com`.

## Gotchas (read before "fixing" anything)

### 1. sharp@0.33 override in package.json

```json
"pnpm": { "overrides": { "sharp": "^0.33.5" } }
```

Plasmo 0.88's transitive `sharp@0.32.6` downloads `libvips-8.14.5-darwin-arm64v8.tar.br` from GitHub releases in a postinstall script. This fails reliably in restrictive networks (GFW resets the TCP mid-download). sharp 0.33+ ships platform binaries as `@img/sharp-*` npm packages (no GitHub fetch), so the override makes `pnpm install` a ~9-second affair instead of a dead-end.

If you upgrade Plasmo to 0.90.5+, the override *may* become unnecessary — verify empirically: remove it, blow away `node_modules` and the lockfile for sharp, `pnpm install`, and check that no package is still trying to hit `github.com/lovell/sharp-libvips`.

### 2. Fonts are inlined as base64 (not web_accessible_resources)

`@font-face { src: url(...) }` referenced from a content-script-injected `<style>` cannot reach a relative path and can't use a bare `chrome-extension://...` URL either — the content script isn't on the origin. The canonical fix is `web_accessible_resources` + `chrome.runtime.getURL()` + dynamic CSS rewriting, which is clunky for a document_start injector.

Instead, `contents/chatgpt.ts` uses Plasmo's `data-base64:` import scheme:

```ts
import anthropicSans  from "data-base64:~assets/fonts/anthropic-sans.woff2"
import anthropicSerif from "data-base64:~assets/fonts/anthropic-serif.woff2"

const fontFaceCSS = `
@font-face { font-family:"Anthropic Sans";  src:url(${anthropicSans})  format("woff2"); … }
@font-face { font-family:"Anthropic Serif"; src:url(${anthropicSerif}) format("woff2"); … }
`
```

Tradeoff: bundle grows from ~12KB to ~403KB (font base64 is ~1.33× binary size). Acceptable for a content script loaded once per tab — Chrome caches the parsed stylesheet, and every SPA navigation is zero-flicker.

### 3. #page-header gradient needs --cloakd-bg-transparent

Using plain `transparent` as the end-stop in a gradient interpolates through `rgba(0,0,0,0)` ("transparent black"), which produces a faint gray band mid-fade when the start color is a warm tone. `base.css` uses a dedicated `--cloakd-bg-transparent` token (same RGB as `--cloakd-bg` with alpha 0), defined in both `light.css` and `dark.css`:

```css
/* light.css */ --cloakd-bg-transparent: rgb(250 249 245 / 0);
/* dark.css  */ --cloakd-bg-transparent: rgb(38 38 36 / 0);
```

When you change `--cloakd-bg`, also update `--cloakd-bg-transparent` in the same file to match. Or switch to CSS Color Level 4 relative syntax `rgb(from var(--cloakd-bg) r g b / 0)` which derives it at compute time (Chrome 119+).

### 4. icon.png is a placeholder

Plasmo requires `assets/icon.png` at build time (autosizes to 16/32/48/64/128). The current file is a flat 512×512 Claude-copper square generated once via:

```sh
node -e "require('./node_modules/.pnpm/sharp@0.33.5/node_modules/sharp')({create:{width:512,height:512,channels:4,background:{r:201,g:100,b:66,alpha:1}}}).png().toFile('assets/icon.png')"
```

Drop in a proper design any time — it just needs to be a square PNG ≥128×128.

### 5. Commented-out blocks in base.css are intentional

Several blocks in `base.css` are commented out (code block overrides, modal `[role="dialog"]` styling, etc.) — these are **paused, not dead**. Leave them alone unless the user explicitly asks you to revive or delete them. Uncommenting without being asked will fight ChatGPT's own styling for elements the user decided to let through untouched.

## Adding support for another site (Gemini, Copilot, Poe, etc.)

1. `contents/<site>.ts` — copy `chatgpt.ts`, change `matches` and the file imports. Keep the same `MutationObserver` pattern.
2. `styles/<site>/{base,light,dark}.css` — same three-file structure. The Anthropic font cascade and `--cloakd-font-*` block from `base.css` can be extracted to `styles/common/fonts.css` when duplication becomes painful (wait until the second site, not in advance).
3. `manifest.host_permissions` in `package.json` — add the new host.
4. Discover the target's own CSS variables first: open DevTools on the site, `getComputedStyle(document.documentElement)`, scan for their `--*` tokens. Re-piping those in your new `base.css` is 10× less code than per-class overrides.

## Things NOT to do

- Don't rename `--cloakd-*` tokens. `base.css` consumes them by name across ~70 declarations.
- Don't rename `--font-anthropic-*` / `--font-ui*` / `--font-user-message` / `--font-claude-response`. These mirror Claude.ai's public variable names; they're the contract.
- Don't add hardcoded colors / radii / font sizes to `base.css`. Add a token in `light.css` + `dark.css` first, then reference it.
- Don't un-comment blocks in `base.css` that are currently commented unless asked. See Gotcha #5.
- Don't use `!important` in `light.css` / `dark.css`. Tokens cascade naturally; `!important` is only needed in `base.css` where selectors fight ChatGPT's Tailwind output.
- Don't install React components or a popup/options page "just in case". This is a content-script-only extension on purpose.
- Don't bump Plasmo or `sharp` without also checking Gotcha #1.
