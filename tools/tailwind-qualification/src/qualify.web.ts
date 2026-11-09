// Node entry body with browser-only Playwright evaluation callbacks.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { nativeOpacity } from './native-engine.ts'
import { adapt, compileTailwind, declarations, scenarios } from './compare.ts'

const args = process.argv.slice(2)

if (args.length !== 2 || args[0] !== '--output') {
  throw new Error('Usage: qualify --output /absolute/local/evidence-directory')
}

const output = resolve(args[1])

await mkdir(output, { recursive: true })

const compiled = await compileTailwind()
const adaptationStarted = performance.now()
const adapted = await adapt(compiled.css)
const adaptationMs = performance.now() - adaptationStarted

await writeFile(join(output, 'official.css'), compiled.css)
await writeFile(join(output, 'adapter.css'), adapted.css)

const inventory = [
  '.flex',
  '.grid',
  '.absolute',
  '.gap-4',
  '.p-4',
  '.px-4',
  '.w-32',
  '.max-w-32',
  '.min-w-0',
  '.flex-1',
  '.items-center',
  '.bg-red-500',
  '.text-sm',
  '.rounded-lg',
  '.invisible',
  '.translate-x-4',
  '.scale-50',
].map((selector) => ({
  selector,
  official: declarations(compiled.css, selector),
  adapted: declarations(adapted.css, selector),
}))

const browser = await chromium.launch({ headless: true })
const results: {
  name: string
  official: string
  adapted: string
  matches: boolean
  warnings: string[]
}[] = []

try {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } })

  for (const scenario of scenarios) {
    const transformed = await adapt(scenario.css)
    // A new document for every observation prevents @property registrations
    // or stylesheets from leaking between the before/after cases.
    const observe = async (css: string) => {
      await page.goto('about:blank')
      await page.setContent(`<style>${css}</style>${scenario.markup}`)
      return page
        .locator(scenario.selector)
        .evaluate(
          (element, property) => getComputedStyle(element).getPropertyValue(property),
          scenario.property,
        )
    }

    const official = await observe(scenario.css)

    assert.equal(official, scenario.expected, `invalid browser oracle: ${scenario.name}`)

    const after = await observe(transformed.css)

    results.push({
      name: scenario.name,
      official,
      adapted: after,
      matches: official === after,
      warnings: transformed.warnings,
    })
  }
} finally {
  await browser.close()
}

const adapterPath = fileURLToPath(import.meta.resolve('@nativescript/tailwind'))
const adapterRoot = dirname(dirname(adapterPath))
const manifest = JSON.parse(await readFile(join(adapterRoot, 'package.json'), 'utf8'))
const adapterSource = await readFile(join(adapterRoot, 'src/removeUnsupported.js'))
const nativeEngine = scenarios.slice(0, 4).map((scenario, index) => ({
  name: scenario.name,
  expected: scenario.expected,
  actual: nativeOpacity(
    scenario.css,
    index === 0 ? ['a', 'b'] : index === 3 ? ['child'] : ['a'],
    index === 3 ? ['parent'] : undefined,
  ),
  evidence: 'desktop CSS engine in Node, no native host',
}))

const lostRules = inventory.filter((rule) => rule.official.length > 0 && rule.adapted.length === 0)
const adapterMatches = results.every((result) => result.matches) && lostRules.length === 0
const engineMatches = nativeEngine.every((result) => result.expected === result.actual)
const adoption = !adapterMatches
  ? 'blocked-semantic-mismatch'
  : !engineMatches
    ? 'blocked-native-engine'
    : 'requires-native-qualification'

const report = {
  schema: 1,
  evidence:
    'Official compiler output and Chromium CSS semantics before/after the native adapter; no native runtime or pixel qualification',
  versions: { tailwind: '4.3.5', adapter: manifest.version, playwright: '1.63.0' },
  adapterSourceSha256: createHash('sha256').update(adapterSource).digest('hex'),
  sizes: {
    officialCssBytes: Buffer.byteLength(compiled.css),
    adaptedCssBytes: Buffer.byteLength(adapted.css),
  },
  timing: {
    compilerMs: compiled.durationMs,
    adaptationMs,
    scope: 'single-process cold compile; not Vite build/watch performance',
  },
  inventory,
  nativeEngine,
  results,
  lostRules,
  warnings: adapted.warnings,
  adoption,
}

await writeFile(join(output, 'comparison.json'), JSON.stringify(report, null, 2) + '\n')
console.log(
  JSON.stringify(
    {
      adoption: report.adoption,
      results,
      nativeEngine,
      warnings: report.warnings,
      report: join(output, 'comparison.json'),
    },
    null,
    2,
  ),
)

if (report.adoption !== 'requires-native-qualification') {
  process.exitCode = 1
}
