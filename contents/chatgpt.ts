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

function inject() {
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement("style")
  el.id = STYLE_ID
  el.setAttribute("data-cloakd", "chatgpt")
  el.textContent = css
  // documentElement is guaranteed to exist at document_start; <head> isn't.
  ;(document.head ?? document.documentElement).appendChild(el)
}

inject()

// ChatGPT occasionally swaps <head> during route transitions; cheaply
// re-inject if our <style> tag disappears. The getElementById short-circuit
// keeps this essentially free on every mutation.
new MutationObserver(inject).observe(document.documentElement, {
  childList: true,
  subtree: true
})
