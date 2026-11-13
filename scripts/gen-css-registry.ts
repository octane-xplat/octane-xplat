// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Regenerates scripts/ns-css-registry.json from the installed
// @nativescript/core plus the selected Mason engine's CSS registrations.
// Anything in a shared stylesheet outside this list is silently dropped
// on native. Re-run after upgrading @nativescript/core.

import { createRequire } from 'node:module'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const req = createRequire(join(process.cwd(), 'apps/mobile/package.json'))
const corePkg = req.resolve('@nativescript/core/package.json')
const coreDir = dirname(corePkg)
const version = JSON.parse(readFileSync(corePkg, 'utf8')).version
const masonPkg = req.resolve('@octane-xplat/nativescript-mason-core/package.json')
const masonDir = dirname(masonPkg)
const masonVersion = JSON.parse(readFileSync(masonPkg, 'utf8')).version

// Walk ui/**/*.js for `cssName: 'prop'` registrations — CssProperty and
// CssAnimationProperty both carry it.
const names = new Set()
const CSSNAME = /cssName:\s*['"]([^'"]+)['"]/g

function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)

    if (entry.isDirectory()) {
      scan(p)
    } else if (entry.name.endsWith('.js')) {
      for (const m of readFileSync(p, 'utf8').matchAll(CSSNAME)) {
        names.add(m[1])
      }
    }
  }
}

scan(join(coreDir, 'ui'))

// Mason's properties module registers display/position, grid placement and
// sizing alongside Core. Scan the shipped registration module without loading
// its platform globals. Presence here proves registration, not value parity.
for (const match of readFileSync(join(masonDir, 'properties.js'), 'utf8').matchAll(CSSNAME)) {
  names.add(match[1])
}
// Mason registers the border-side shorthands from its SIDES loop.
for (const side of ['top', 'right', 'bottom', 'left']) {
  names.add(`border-${side}`)
}

// Parsed by CssAnimationParser (css-animation-parser.js), not registered
// as cssNames — the `animation` shorthand + its longhands.
for (const a of [
  'animation',
  'animation-name',
  'animation-duration',
  'animation-delay',
  'animation-timing-function',
  'animation-iteration-count',
  'animation-direction',
  'animation-fill-mode',
]) {
  names.add(a)
}

const registry = {
  generatedFrom: `@nativescript/core@${version} + @octane-xplat/nativescript-mason-core@${masonVersion}`,
  properties: [...names].sort(),
}

writeFileSync(
  new URL('./ns-css-registry.json', import.meta.url),
  JSON.stringify(registry, null, '\t') + '\n',
)

console.log(
  `[css-registry] ${registry.properties.length} properties from ${registry.generatedFrom}`,
)
