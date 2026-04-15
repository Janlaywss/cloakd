#!/usr/bin/env node
/**
 * Pack build/chrome-mv3-prod into a signed CRX3 file.
 *
 * Used by .github/workflows/release.yml. Works locally too:
 *
 *   pnpm build
 *   CRX_KEY=./cloakd.pem node scripts/pack-crx.mjs
 *
 * Inputs:
 *   - build/chrome-mv3-prod/manifest.json   (produced by `pnpm build`)
 *   - $CRX_KEY or ./cloakd.pem              (PEM private key)
 *
 * Output:
 *   - cloakd-v<version>.crx at the repo root
 *
 * Depends on the `crx3` package (devDependency).
 */

import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import crx3 from "crx3"

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
)

const pkg = JSON.parse(
  readFileSync(path.join(root, "package.json"), "utf8")
)

const manifestPath = path.join(root, "build/chrome-mv3-prod/manifest.json")
const keyPath = process.env.CRX_KEY ?? path.join(root, "cloakd.pem")
const crxPath = path.join(root, `cloakd-v${pkg.version}.crx`)

if (!existsSync(manifestPath)) {
  console.error(
    `✗ manifest not found: ${path.relative(root, manifestPath)}\n` +
      `  run \`pnpm build\` first.`
  )
  process.exit(1)
}

if (!existsSync(keyPath)) {
  console.error(
    `✗ private key not found: ${path.relative(root, keyPath)}\n` +
      `  generate one with \`openssl genrsa -out cloakd.pem 2048\`\n` +
      `  or set CRX_KEY to point at an existing PEM.`
  )
  process.exit(1)
}

console.log(`→ manifest: ${path.relative(root, manifestPath)}`)
console.log(`→ key:      ${path.relative(root, keyPath)}`)
console.log(`→ output:   ${path.relative(root, crxPath)}`)

await crx3([manifestPath], {
  crxPath,
  keyPath
})

console.log(`✓ Packed ${path.basename(crxPath)}`)
