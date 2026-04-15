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

> ⚠️ Personal project. Currently supports ChatGPT only (`chatgpt.com` / `chat.openai.com`). Gemini is on the roadmap.

---

## Install

### Prerequisites

- Node 20+
- pnpm (recommended) or npm

### Steps

```sh
# 1. Install deps (~9 seconds)
pnpm install

# 2. Build production bundle
pnpm build

# 3. Load into Chrome
# chrome://extensions → enable Developer mode (top right)
# → Load unpacked → select build/chrome-mv3-prod/
```

Then visit https://chatgpt.com and you should see the Claude-styled UI immediately.

### Dev mode

For active development (CSS auto-rebuild on save):

```sh
pnpm dev
```

Load `build/chrome-mv3-dev/` instead. After any rebuild, click the **refresh** icon on the Cloakd card in `chrome://extensions`, then hard-refresh chatgpt.com (⌘⇧R / Ctrl+Shift+R).

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
├── AGENT.md                    context file for AI coding assistants
├── README.md                   this file (English)
├── README.zh-CN.md             Chinese version
├── package.json
├── tsconfig.json
├── popup.tsx                   extension popup (React) — per-product toggles
├── popup.css
├── assets/
│   ├── icon.png                512×512 placeholder (replaceable)
│   └── fonts/
│       ├── anthropic-sans.woff2   Anthropic Sans Web Regular
│       └── anthropic-serif.woff2  Anthropic Serif Web Regular
├── contents/
│   └── chatgpt.ts              content script: injects @font-face + 3 CSS files
├── scripts/
│   └── pack-crx.mjs            CRX packer (used by CI; runs locally too)
├── styles/
│   └── chatgpt/
│       ├── base.css            fonts / geometry / selectors
│       ├── light.css           light-mode tokens
│       └── dark.css            dark-mode tokens
└── .github/workflows/
    └── release.yml             auto-build + auto-publish CRX on merge to `release`
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

**Every merge into the `release` branch** triggers a GitHub Actions workflow ([`.github/workflows/release.yml`](.github/workflows/release.yml)) that builds, signs, packs a `.crx`, and publishes a GitHub Release with both `.crx` and `.zip` assets.

### One-time setup: CRX signing key

The `.crx` is signed with a private key. Using the same key across releases keeps the extension ID stable.

1. Generate a 2048-bit RSA key locally:

   ```sh
   openssl genrsa -out cloakd.pem 2048
   ```

2. Add it as a repository secret:

   - Go to `https://github.com/<you>/cloakd/settings/secrets/actions`
   - Click **New repository secret**
   - Name: `CRX_PRIVATE_KEY`
   - Value: the full contents of `cloakd.pem` (including the `-----BEGIN PRIVATE KEY-----` / `-----END PRIVATE KEY-----` lines)

3. Store `cloakd.pem` somewhere safe (password manager). **Never commit it** — it's excluded via `.gitignore`. Losing it means the next release gets a different extension ID, and existing installs become orphaned.

### Cutting a release

```sh
# 1. Bump version in package.json (e.g. 0.0.1 → 0.0.2)
# 2. Commit it on your dev branch
git add package.json pnpm-lock.yaml
git commit -m "release v0.0.2"

# 3. Merge into release branch and push
git checkout release
git merge main
git push origin release
```

The workflow will:

1. Read the version from `package.json`
2. **Fail if `v<version>` tag already exists** (reminder to bump)
3. `pnpm install --frozen-lockfile` → `pnpm build`
4. Write `CRX_PRIVATE_KEY` to a temp `cloakd.pem`
5. Run `node scripts/pack-crx.mjs` → `cloakd-v<version>.crx`
6. Zip `build/chrome-mv3-prod/` → `cloakd-v<version>.zip`
7. Create a GitHub Release tagged `v<version>` with both files attached
8. Clean up the temp key

### Packing a CRX locally

```sh
pnpm build
CRX_KEY=./cloakd.pem node scripts/pack-crx.mjs
# → cloakd-v<version>.crx at repo root
```

### A note on `.crx` installation

Chrome has become strict about installing `.crx` files from outside the Web Store. In practice:

- **Chrome / Chromium on personal machines**: most users should download the `.zip`, unzip it, and use "Load unpacked" in developer mode.
- **Enterprise-managed Chrome**, **Brave**, **Edge**: often more permissive with external `.crx` — try the `.crx` first.
- **Developer workflow**: always `Load unpacked` from `build/chrome-mv3-dev/`; never install a `.crx` during development.

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
