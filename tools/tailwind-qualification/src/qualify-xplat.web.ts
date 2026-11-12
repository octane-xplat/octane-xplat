// Node entry body with browser-only Playwright evaluation callbacks.
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual, parseArgs } from 'node:util'
import { chromium, type Browser } from 'playwright'

interface Observation {
  name: string
  origin: 'generated' | 'reference'
  actual: unknown
  expected: unknown
  passed: boolean
}

interface BrowserQualification {
  target: 'web' | 'linux'
  cssSha256: string
  observations: Observation[]
  passed: boolean
}

const directory = dirname(fileURLToPath(import.meta.url))
const { values } = parseArgs({ options: { output: { type: 'string' } } })

if (!values.output) {
  throw new Error('Pass --output /absolute/path/to/a/new/local/report-directory')
}

const output = resolve(values.output)

await mkdir(output, { recursive: true })

const packed = spawnSync(
  process.execPath,
  [resolve(directory, '../packed-consumer.mts'), '--output', output],
  { encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024 },
)

if (packed.status !== 0) {
  throw new Error(
    `Packed consumer failed (${packed.status ?? packed.signal}):\n${packed.stdout}\n${packed.stderr}`,
  )
}

async function qualify(browser: Browser, target: 'web' | 'linux'): Promise<BrowserQualification> {
  const css = await readFile(resolve(output, `compiled-${target}.css`), 'utf8')
  const observations: Observation[] = []
  const check = (
    name: string,
    actual: unknown,
    expected: unknown,
    origin: Observation['origin'] = 'generated',
  ) => {
    observations.push({
      name,
      origin,
      actual,
      expected,
      passed: isDeepStrictEqual(actual, expected),
    })
  }

  const page = await browser.newPage({
    viewport: { width: 639, height: 800 },
    colorScheme: 'light',
  })

  try {
    await page.setContent(`<!doctype html><html><head><style>body { margin: 0 }</style></head><body>
<div id="spacing" class="p-4 bg-primary rounded-lg">Packing</div>
<div id="row" class="flex flex-row gap-2 w-[200px]">
  <div id="first" class="w-6 h-5 shrink-0"></div><div id="second" class="w-8 h-5 shrink-0"></div>
</div>
<div class="grid grid-cols-[40px_60px] grid-rows-[20px] gap-2 w-[200px]">
  <div id="cell-a"></div><div id="cell-b"></div>
</div>
<div id="positioned" class="relative w-[200px] h-[80px]">
  <div id="overlay" class="absolute left-3 top-4 w-6 h-5"></div>
</div>
<div id="type-parent" class="leading-6"><span id="type-child" class="text-sm font-bold">Packed</span></div>
<div style="--tw-border-style: dashed"><div id="border" class="border"></div></div>
<div id="transform-parent" class="translate-x-4"><div id="transform-child" class="translate-y-2 scale-50"></div></div>
<div id="scoped" style="--color-primary: #abcdef"><div id="scoped-color" class="bg-primary"></div></div>
<div id="responsive" class="opacity-50 sm:opacity-75"></div>
<div id="mode" class="dark:bg-primary"></div>
<div id="dynamic" class="opacity-50"></div>
<div id="hover" class="hover:opacity-55" style="width: 20px; height: 20px"></div>
<div style="line-height: 28px; --leading: 36px"><div id="ref-initial" style="--leading: initial; line-height: var(--leading, 20px)"></div></div>
<div id="ref-color" style="color: var(--missing-color, rgb(17, 34, 51))"></div>
<div id="ref-width" style="width: 24px; width: calc(var(--missing-size) * 2)"></div>
<div id="ref-padding" style="padding: 4px; padding: var(--missing-padding)"></div>
</body></html>`)

    await page.addStyleTag({ content: css })

    const initial = await page.evaluate(() => {
      const element = (id: string) => {
        const found = document.getElementById(id)

        if (!found) {
          throw new Error(`Missing fixture element ${id}`)
        }

        return found
      }

      const style = (id: string) => getComputedStyle(element(id))
      const bounds = (id: string) => element(id).getBoundingClientRect()

      return {
        padding: style('spacing').paddingTop,
        radius: style('spacing').borderTopLeftRadius,
        color: style('spacing').backgroundColor,
        firstWidth: bounds('first').width,
        secondWidth: bounds('second').width,
        rowOffset: bounds('second').left - bounds('first').left,
        gridWidths: [bounds('cell-a').width, bounds('cell-b').width],
        gridOffset: bounds('cell-b').left - bounds('cell-a').left,
        absoluteOffset: [
          bounds('overlay').left - bounds('positioned').left,
          bounds('overlay').top - bounds('positioned').top,
        ],
        fontSize: style('type-child').fontSize,
        fontWeight: style('type-child').fontWeight,
        lineHeights: [style('type-parent').lineHeight, style('type-child').lineHeight],
        borderStyle: style('border').borderTopStyle,
        borderWidth: style('border').borderTopWidth,
        parentTranslate: style('transform-parent').translate,
        childTranslate: style('transform-child').translate,
        childScale: style('transform-child').scale,
        scopedColor: style('scoped-color').backgroundColor,
        belowBreakpoint: style('responsive').opacity,
        lightModeColor: style('mode').backgroundColor,
        hoverAvailable: matchMedia('(hover: hover)').matches,
        referenceInitialFallback: style('ref-initial').lineHeight,
        referenceColorFallback: style('ref-color').color,
        referenceInvalidWidthUsesAuto: bounds('ref-width').width === document.body.clientWidth,
        referenceInvalidPadding: style('ref-padding').paddingTop,
      }
    })

    check('shared spacing', initial.padding, '16px')
    check('shared round radius', initial.radius, '12px')
    check('runtime UI token', initial.color, 'rgb(17, 34, 51)')
    check('flex child widths', [initial.firstWidth, initial.secondWidth], [24, 32])
    check('flex gap and direction', initial.rowOffset, 32)
    check('grid track widths', initial.gridWidths, [40, 60])
    check('grid gap', initial.gridOffset, 48)
    check('absolute edges', initial.absoluteOffset, [12, 16])
    check('shared text size', initial.fontSize, '14px')
    check('font utility', initial.fontWeight, '700')
    check('per-element leading default', initial.lineHeights, ['24px', '20px'])
    check('per-element border default', initial.borderStyle, 'solid')
    check('border width', initial.borderWidth, '1px')
    check('parent translation', initial.parentTranslate, '16px')
    check('child translation does not reuse parent internal X', initial.childTranslate, '0px 8px')
    check('child scale', Number.parseFloat(initial.childScale), 0.5)
    check('scoped theme token', initial.scopedColor, 'rgb(171, 205, 239)')
    check('below breakpoint', initial.belowBreakpoint, '0.5')
    check('light mode', initial.lightModeColor, 'rgba(0, 0, 0, 0)')
    check('desktop hover capability', initial.hoverAvailable, true)
    check('initial variable fallback', initial.referenceInitialFallback, '20px', 'reference')
    check('complete color fallback', initial.referenceColorFallback, 'rgb(17, 34, 51)', 'reference')
    check(
      'invalid variable width restores auto',
      initial.referenceInvalidWidthUsesAuto,
      true,
      'reference',
    )

    check(
      'invalid variable shorthand restores defaults',
      initial.referenceInvalidPadding,
      '0px',
      'reference',
    )

    await page.setViewportSize({ width: 640, height: 800 })
    check(
      'inclusive breakpoint',
      await page.locator('#responsive').evaluate((node) => getComputedStyle(node).opacity),
      '0.75',
    )

    await page.emulateMedia({ colorScheme: 'dark' })
    check(
      'dark mode variant',
      await page.locator('#mode').evaluate((node) => getComputedStyle(node).backgroundColor),
      'rgb(17, 34, 51)',
    )

    await page.evaluate(() =>
      document.documentElement.style.setProperty('--color-primary', '#335577'),
    )

    check(
      'runtime token change',
      await page.locator('#spacing').evaluate((node) => getComputedStyle(node).backgroundColor),
      'rgb(51, 85, 119)',
    )

    check(
      'scoped token remains local',
      await page
        .locator('#scoped-color')
        .evaluate((node) => getComputedStyle(node).backgroundColor),
      'rgb(171, 205, 239)',
    )

    const dynamic = page.locator('#dynamic')

    await dynamic.evaluate((node) => node.setAttribute('class', ''))
    check('class removal', await dynamic.evaluate((node) => getComputedStyle(node).opacity), '1')
    await dynamic.evaluate((node) => node.setAttribute('class', 'opacity-50'))
    check(
      'class application',
      await dynamic.evaluate((node) => getComputedStyle(node).opacity),
      '0.5',
    )

    await dynamic.evaluate((node) => node.setAttribute('style', 'opacity: .9'))
    await dynamic.evaluate((node) => node.setAttribute('class', 'opacity-75'))
    check(
      'inline precedence after class change',
      await dynamic.evaluate((node) => getComputedStyle(node).opacity),
      '0.9',
    )

    await dynamic.evaluate((node) => node.removeAttribute('style'))
    check(
      'inline removal',
      await dynamic.evaluate((node) => getComputedStyle(node).opacity),
      '0.75',
    )

    await page.locator('#hover').hover()
    check(
      'browser hover variant',
      await page.locator('#hover').evaluate((node) => getComputedStyle(node).opacity),
      '0.55',
    )
  } finally {
    await page.close()
  }

  return {
    target,
    cssSha256: createHash('sha256').update(css).digest('hex'),
    observations,
    passed: observations.every((entry) => entry.passed),
  }
}

const browser = await chromium.launch({ headless: true })
const results: BrowserQualification[] = []

try {
  for (const target of ['web', 'linux'] as const) {
    results.push(await qualify(browser, target))
  }

  await writeFile(
    resolve(output, 'browser.json'),
    JSON.stringify(
      {
        browser: browser.version(),
        evidence:
          'Chromium computed styles/layout and synthesized browser hover; no native runtime, OS input, screenshots or painting analysis',
        results,
      },
      null,
      2,
    ) + '\n',
    { flag: 'wx' },
  )
} finally {
  await browser.close()
}

const failures = results.flatMap((result) =>
  result.observations
    .filter((entry) => !entry.passed)
    .map((entry) => `${result.target}: ${entry.name}`),
)

if (failures.length) {
  throw new Error(
    `Xplat browser qualification failed: ${failures.join(', ')}. See ${output}/browser.json`,
  )
}

console.log(
  `Xplat packed browser qualification passed (${results.reduce((count, result) => count + result.observations.length, 0)} observations). Evidence: ${output}`,
)
