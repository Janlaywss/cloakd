import type { PlasmoCSConfig } from "plasmo"

import baseCSS  from "data-text:~styles/chatgpt/base.css"
import darkCSS  from "data-text:~styles/chatgpt/dark.css"
import lightCSS from "data-text:~styles/chatgpt/light.css"

import anthropicSans from "data-base64:~assets/fonts/anthropic-sans.woff2"
import anthropicSerif from "data-base64:~assets/fonts/anthropic-serif.woff2"

/**
 * Cloakd — ChatGPT content script.
 *
 * Injects Claude-styled theme tokens + selector overrides into the page
 * as early as possible (document_start). Re-injects on DOM mutations in
 * case ChatGPT's SPA navigations replace <head>.
 */
export const config: PlasmoCSConfig = {
  matches: ["https://chatgpt.com/*", "https://chat.openai.com/*"],
  run_at: "document_start"
}

const STYLE_ID = "cloakd-chatgpt-style"

// Anthropic's own fonts (pulled from Claude.ai), inlined as base64
// data URIs. Inlining sidesteps the web_accessible_resources +
// chrome.runtime.getURL dance for content scripts, and survives SPA
// navigations. Only Regular (400) is shipped; bolder weights fall
// back to system sans via the tail of --font-anthropic-{sans,serif}.
// `font-synthesis: none` in chatgpt.css prevents ugly faux-bold.
const fontFaceCSS = `
@font-face {
  font-family: "Anthropic Sans";
  font-style:  normal;
  font-weight: 400;
  font-display: swap;
  src: url(${anthropicSans}) format("woff2");
}
@font-face {
  font-family: "Anthropic Serif";
  font-style:  normal;
  font-weight: 400;
  font-display: swap;
  src: url(${anthropicSerif}) format("woff2");
}
`

// Order is for readability; CSS custom properties resolve at compute
// time so any ordering is functionally equivalent. We go:
//   @font-face → light tokens → dark tokens (overrides at html.dark)
//               → base (shared tokens + all selector overrides).
const css = `${fontFaceCSS}\n${lightCSS}\n${darkCSS}\n${baseCSS}`

// ─── Enabled-state handling ──────────────────────────────────────
// State shape:
//   chrome.storage.sync["cloakd.enabled"] = { chatgpt: true, gemini: true, ... }
// A missing key / missing product defaults to enabled — new installs
// are reskinned immediately without the user having to click anything.
const STORAGE_KEY = "cloakd.enabled"
const PRODUCT_ID = "chatgpt"

/**
 * Optimistic flag updated first from the synchronous default, then
 * replaced once chrome.storage.sync.get() resolves. Guards both the
 * MutationObserver path and the storage-change path below.
 */
let enabled = true

function remove() {
  document.getElementById(STYLE_ID)?.remove()
}

function inject() {
  if (!enabled) return
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement("style")
  el.id = STYLE_ID
  el.setAttribute("data-cloakd", "chatgpt")
  el.textContent = css
  // documentElement is guaranteed to exist at document_start; <head> isn't.
  ;(document.head ?? document.documentElement).appendChild(el)
}

// Inject synchronously under the optimistic assumption that the
// extension is enabled. The async storage read below will undo this
// within ~a frame if the user has actually disabled ChatGPT — a
// short FOUC we accept in exchange for zero-flicker on the common
// (enabled) path.
inject()

// Hydrate the real state from storage. If we were wrong to inject,
// strip the style tag; if we were right, do nothing.
chrome.storage.sync.get([STORAGE_KEY], (result) => {
  const map = (result?.[STORAGE_KEY] ?? {}) as Record<string, boolean>
  enabled = map[PRODUCT_ID] ?? true
  if (!enabled) remove()
})

// React to toggles from the popup (or Chrome Sync from another device).
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return
  const change = changes[STORAGE_KEY]
  if (!change) return
  const map = (change.newValue ?? {}) as Record<string, boolean>
  const next = map[PRODUCT_ID] ?? true
  if (next === enabled) return
  enabled = next
  if (enabled) inject()
  else remove()
})

// ChatGPT occasionally swaps <head> during route transitions; cheaply
// re-inject if our <style> tag disappears. The getElementById short-circuit
// keeps this essentially free on every mutation. Respects the enabled
// flag so a disabled state stays disabled across SPA navigations.
new MutationObserver(() => {
  if (enabled && !document.getElementById(STYLE_ID)) inject()
}).observe(document.documentElement, {
  childList: true,
  subtree: true
})
