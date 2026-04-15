<p align="center">
  <img src="before.png" alt="Cloakd — ChatGPT reskinned to look like Claude.ai" width="720" />
</p>

# Cloakd

**Languages:** English · [简体中文](README.zh-CN.md)

**Reskin ChatGPT to look and feel like Claude.ai.** A [Plasmo](https://plasmo.com) browser extension, pure CSS injection — no DOM mutation, no React injection into host pages, loaded once and done.

- Warm cream background / copper accent
- Anthropic Sans for UI, Anthropic Serif for assistant responses (matches claude.ai)
- Rounded bubbles, hover / active states that mirror Claude's interaction feedback
- Light / dark mode follows ChatGPT's own setting
- Every tunable value lives as a CSS variable — 3 files to touch for any tweak
- Per-product on/off toggles via extension popup
- Ships with [`claude-communication-style-guide.md`](claude-communication-style-guide.md) — Claude's *voice* as a prompt, companion to the visual reskin

> ⚠️ Personal project. Currently supports ChatGPT only (`chatgpt.com` / `chat.openai.com`). Gemini is on the roadmap.

---

## Install

Two paths — pick the one that fits.

### For end users — download the zip

Chrome blocks sideloaded `.crx` files with `CRX_REQUIRED_PROOF_MISSING` since v75 (a Web Store–issued proof of origin is mandatory for `.crx` installs and we don't have one). So Cloakd ships as a `.zip` you unpack and load as a developer-mode extension. Same result, different wrapper.

1. Grab `cloakd-v<version>.zip` from [Releases](https://github.com/Janlaywss/cloakd/releases/latest)
2. Unzip it to a **permanent** location. The folder must stay where you put it — Chrome remembers the absolute path you loaded from, so deleting or moving it breaks the extension.

   ```sh
   mkdir -p ~/Applications/cloakd
   unzip cloakd-v*.zip -d ~/Applications/cloakd
   ```

3. Open `chrome://extensions`
4. Toggle **Developer mode** on (top-right corner)
5. Click **Load unpacked** and select the unzipped folder
6. Visit https://chatgpt.com — the Claude-styled UI should appear immediately

**Updating**: download the new release's `.zip`, unzip it **over the same folder**, then click the ↻ refresh icon on the Cloakd card in `chrome://extensions`. No need to remove and re-add.

**Dismiss the "Disable developer mode" banner**: Chrome nags you once per session when you have developer-mode extensions loaded. Click **Cancel** / **Keep developer mode** (wording varies by version). It's expected — any non–Web Store extension triggers this.

### For contributors — build from source

Prerequisites: Node 20+ and pnpm.

```sh
pnpm install     # ~9 seconds
pnpm build       # production bundle → build/chrome-mv3-prod/
# OR
pnpm dev         # watch mode → build/chrome-mv3-dev/
```

Then load `build/chrome-mv3-prod/` (or `build/chrome-mv3-dev/`) via **Load unpacked** in `chrome://extensions`.

After editing any CSS / TS file in dev mode, Plasmo auto-rebuilds. Click the ↻ icon on the Cloakd card + hard-refresh chatgpt.com (⌘⇧R / Ctrl+Shift+R) to see the change.

> **On the `sharp@0.33` override**: the project pins `sharp@^0.33.5` via `pnpm.overrides` to sidestep legacy sharp 0.32's postinstall libvips fetch from GitHub releases (unreliable behind restrictive networks). See [AGENT.md](AGENT.md) Gotcha #1.

---

## Per-product toggle

Click the Cloakd icon in the Chrome toolbar to open the popup. Each supported product has its own switch:

```
┌────────────────────────────────┐
│ Cloakd                         │
│ Claude-style reskin            │
│────────────────────────────────│
│ ChatGPT                  [●━━] │  ← on
│ chatgpt.com                    │
│                                │
│ Gemini                  ┌────┐ │  ← disabled
│ gemini.google.com       │SOON│ │
│                         └────┘ │
│────────────────────────────────│
│ Changes apply instantly.       │
└────────────────────────────────┘
```

Changes apply instantly — no page reload. State persists via `chrome.storage.sync`, so it follows you across devices on the same Chrome profile.

---

## Claude's voice (bonus)

Cloakd gives ChatGPT the Claude *look*. For Claude's *voice*, this repo also ships [`claude-communication-style-guide.md`](claude-communication-style-guide.md) — a 10-principle distillation of how Claude actually communicates:

1. **Tone** — warm but direct; no hedging, no clinical coldness
2. **Structure** — prose first, lists only when earned
3. **Calibration** — read the room; match expertise, don't lecture experts
4. **Honesty** — say "I don't know" plainly; distinguish fact / inference / opinion
5. **Emotional register** — steady, not flat; no hollow enthusiasm
6. **Economy** — every sentence earns its place; no restating, no padding
7. **Opinions** — have them, defend them with reasoning, hold them lightly
8. **Language** — clean, precise, natural; no AI-isms or corporate jargon
9. **Error handling** — own mistakes, fix them, move on without groveling
10. **Meta** — be useful, be real; treat the reader like an intelligent adult

### How to use it

Paste the full contents of [`claude-communication-style-guide.md`](claude-communication-style-guide.md) into **ChatGPT → Settings → Personalization → Custom instructions → "How would you like ChatGPT to respond?"** (or the equivalent field in Claude-desktop, Cursor, LibreChat, whatever you use). Combined with Cloakd's visual reskin, ChatGPT reads and looks like Claude.

The guide stands on its own — you can use it without the extension, or fork it as a base for your own AI persona prompts.

---

## How to tune the theme

All tunable values live under `styles/chatgpt/` in three files:

| File | Scope | Contents |
|---|---|---|
| [`styles/chatgpt/light.css`](styles/chatgpt/light.css) | Light mode only | All light-theme tokens (colors, shadows, borders) |
| [`styles/chatgpt/dark.css`](styles/chatgpt/dark.css) | Dark mode only | Same token names, dark values |
| [`styles/chatgpt/base.css`](styles/chatgpt/base.css) | Both modes | Font stack, radii, transitions, plus ALL selectors (selectors read tokens via `var(...)` — never hardcoded) |

**Rule of thumb**: colors / shadows → `light.css` or `dark.css`. Fonts / radii / transitions → `base.css`. Which element uses which token → the lower half of `base.css`.

### Common tweaks

```css
/* light.css — pure white background */
--cloakd-bg: #FFFFFF;
--cloakd-bg-transparent: rgb(255 255 255 / 0);  /* keep in sync */

/* base.css — user bubble in serif */
--font-user-message: var(--font-ui-serif);

/* base.css — rounder bubble */
--cloakd-radius-bubble: 20px;

/* light.css + dark.css — swap accent color */
--cloakd-accent: #6C63FF;
--cloakd-accent-hover: #5850E0;
--cloakd-accent-soft: rgba(108, 99, 255, 0.12);
```

After saving, `pnpm dev` auto-rebuilds. Click the extension's refresh icon + hard-refresh the page.

### Token naming

Two namespaces, two responsibilities:

- **`--cloakd-*`** — this project's own semantic tokens (`--cloakd-bg`, `--cloakd-accent`, `--cloakd-radius-bubble`, ...). All selectors consume these.
- **`--font-*`** — font-related tokens that mirror Claude.ai's own variable names exactly (`--font-ui`, `--font-ui-serif`, `--font-user-message`, `--font-claude-response`, `--font-anthropic-sans/serif/mono`, ...). CSS snippets copied straight from Claude.ai will "just work".

---

## Project layout

```
cloakd/
├── AGENT.md                              context file for AI coding assistants
├── README.md                             this file (English)
├── README.zh-CN.md                       Chinese version
├── claude-communication-style-guide.md   Claude's voice as a reusable prompt
├── before.png                            hero screenshot
├── package.json
├── tsconfig.json
├── popup.tsx                             extension popup (React) — per-product toggles
├── popup.css
├── assets/
│   ├── icon.png                          512×512 placeholder (replaceable)
│   └── fonts/
│       ├── anthropic-sans.woff2          Anthropic Sans Web Regular
│       └── anthropic-serif.woff2         Anthropic Serif Web Regular
├── contents/
│   └── chatgpt.ts                        content script: injects @font-face + 3 CSS files
├── styles/
│   └── chatgpt/
│       ├── base.css                      fonts / geometry / selectors
│       ├── light.css                     light-mode tokens
│       └── dark.css                      dark-mode tokens
└── .github/workflows/
    └── release.yml                       auto-build + publish .zip on merge to `release`
```

---

## Fonts

The two woff2 files are inlined into the content script bundle via Plasmo's `data-base64:` import:

```ts
// contents/chatgpt.ts
import anthropicSans  from "data-base64:~assets/fonts/anthropic-sans.woff2"
import anthropicSerif from "data-base64:~assets/fonts/anthropic-serif.woff2"
```

**Why inline**: a content-script-injected `<style>` with `@font-face { src: url(...) }` can't read extension-relative files without the `web_accessible_resources` + `chrome.runtime.getURL()` dance, which also flickers on first paint. Inlining bloats the bundle from ~12KB to ~403KB but gives zero-flicker SPA navigation.

**Known limits**:
- **Regular 400 only.** Bold / italic text falls back to `system-ui` (thanks to `font-synthesis: none`, Chrome won't synthesize ugly faux-bold). To match claude.ai fully, grab heavier weights from Claude's devtools → Network tab, drop them in `assets/fonts/`, and add matching `@font-face` blocks in [`contents/chatgpt.ts`](contents/chatgpt.ts).
- **No Anthropic Mono.** Code blocks use system mono (SF Mono / Menlo).

---

## Release

**Every merge into the `release` branch** triggers [`.github/workflows/release.yml`](.github/workflows/release.yml), which:

1. Reads `version` from `package.json`
2. **Fails if `v<version>` tag already exists** — bump your version first
3. `pnpm install --frozen-lockfile` → `pnpm build`
4. Zips `build/chrome-mv3-prod/` → `cloakd-v<version>.zip`
5. Creates a GitHub Release tagged `v<version>` with the zip attached

### Cutting a release

```sh
# 1. Bump version in package.json (e.g. 0.0.1 → 0.0.2)
git add package.json pnpm-lock.yaml
git commit -m "release v0.0.2"

# 2. Merge into release branch and push
git checkout release
git merge main
git push origin release
```

CI takes over from there. Check the **Actions** tab to watch it run, then **Releases** for the finished zip.

### Why zip and not .crx?

Chrome rejects self-signed `.crx` files with `CRX_REQUIRED_PROOF_MISSING` regardless of whether the signature is technically valid — a Web Store–issued proof of installation origin is mandatory for `.crx` installs, and self-distributed extensions can't get one. The `.zip` + Load unpacked path doesn't need any proof and produces an identical extension state once loaded.

If you really want a `.crx` (e.g. for Brave or Ungoogled Chromium which are more permissive), pack one manually with any CRX3 tool against your own key — the build output at `build/chrome-mv3-prod/` is what you'd feed in. But it's not what most users want, so the CI pipeline skips it.

---

## Known limitations

1. **ChatGPT's Tailwind class names churn.** Fallback selectors like `[class*="rounded-3xl"]` may stop matching when OpenAI refactors. Use DevTools to inspect the actual DOM and append more specific selectors to [`styles/chatgpt/base.css`](styles/chatgpt/base.css).
2. **Plasmo 0.88** — 0.90.5 is available. Upgrading may let you drop the `pnpm.overrides.sharp` entry — see [AGENT.md](AGENT.md) Gotcha #1.
3. **Not tested on Firefox.** Only verified on Chromium (Chrome / Edge / Arc / Brave). Plasmo supports Firefox in theory; untested here.

---

## Roadmap

- [ ] Gemini (`gemini.google.com`) support — `contents/gemini.ts` + `styles/gemini/{base,light,dark}.css`
- [ ] Heavier font weights (Medium / Semibold / Bold)
- [ ] Options page — tune tokens from the extension UI, no file editing
- [ ] Firefox / Safari builds

---

## Contributing / hacking

Read [AGENT.md](AGENT.md) for project conventions, design principles, and known gotchas. It's written as a context file for AI coding assistants (Claude Code, Cursor, Copilot) but it's also the best human-readable architecture doc.
