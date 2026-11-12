import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { isDeepStrictEqual, parseArgs } from 'node:util'
import { build, createServer, preview } from 'vite'
import { chromium } from 'playwright'

const { values } = parseArgs({ options: { output: { type: 'string' } } })

assert.ok(values.output, 'Pass --output for retained app evidence')

const output = resolve(values.output)
const root = process.cwd()

await mkdir(output, { recursive: true })

const observations = []
const errors = []
const assets = []
let browserVersion
let browser
let failure

function progress(stage) {
  writeFileSync(
    join(output, 'app-progress.json'),
    JSON.stringify({ stage, observations, errors }, null, 2) + '\n',
  )
}

function check(phase, name, actual, expected) {
  observations.push({ phase, name, actual, expected, passed: isDeepStrictEqual(actual, expected) })
  progress(`${phase}: ${name}`)
}

async function snapshot(page) {
  return page.evaluate(() => {
    const element = (id) => {
      const found = document.querySelector(`[data-testid="${id}"]`)

      if (!found) {
        throw new Error(`Missing UI host ${id}`)
      }

      return found
    }

    const bounds = (id) => element(id).getBoundingClientRect()
    const style = (id) => getComputedStyle(element(id))

    return {
      padding: style('spacing').paddingTop,
      radius: style('spacing').borderTopLeftRadius,
      color: style('spacing').backgroundColor,
      font: [style('type').fontSize, style('type').lineHeight, style('type').fontWeight],
      row: [
        style('row').display,
        style('row').flexDirection,
        bounds('row').width,
        bounds('first').width,
        bounds('second').width,
        bounds('second').left - bounds('first').left,
      ],
      grid: [
        style('grid').display,
        bounds('cell-a').width,
        bounds('cell-b').width,
        bounds('cell-b').left - bounds('cell-a').left,
      ],
      absolute: [
        style('absolute').position,
        bounds('absolute').left - bounds('relative').left,
        bounds('absolute').top - bounds('relative').top,
      ],
      width: bounds('dynamic').width,
      widthClasses: ['w-8', 'w-12'].filter((name) => element('dynamic').classList.contains(name)),
      inlineWidth: element('dynamic').style.width,
      responsive: style('responsive').opacity,
      nested: style('nested').backgroundColor,
      rootMode: document.documentElement.style.colorScheme,
      rootTheme: document.documentElement.getAttribute('data-xds-theme'),
    }
  })
}

async function waitValue(page, key, expected) {
  const deadline = performance.now() + 10000

  while (true) {
    const current = await snapshot(page)

    if (isDeepStrictEqual(current[key], expected)) {
      return current
    }

    assert.ok(
      performance.now() < deadline,
      `${key}: ${JSON.stringify(current[key])}, expected ${JSON.stringify(expected)}`,
    )

    await new Promise((resolve) => setTimeout(resolve, 25))
  }
}

async function qualify(phase, url, hmr = false) {
  const context = await browser.newContext({
    viewport: { width: 639, height: 800 },
    colorScheme: 'light',
  })

  const page = await context.newPage()

  page.setDefaultTimeout(15000)
  page.setDefaultNavigationTimeout(15000)
  progress(`${phase}: navigate`)
  page.on('pageerror', (error) => errors.push({ phase, message: error.message }))
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push({ phase, message: message.text() })
    }
  })

  try {
    await page.goto(url)
    await page.getByTestId('dynamic').waitFor()
    progress(`${phase}: mounted`)

    const initial = await waitValue(page, 'color', 'rgb(18, 52, 86)')

    check(phase, 'UI padding uses generated spacing', initial.padding, '16px')
    check(phase, 'UI radius uses runtime theme token', initial.radius, '12px')
    check(phase, 'UI typography uses generated values', initial.font, ['20px', '24px', '700'])
    check(phase, 'View flex layout', initial.row, ['flex', 'row', 200, 24, 32, 32])
    check(phase, 'View grid layout', initial.grid, ['grid', 40, 60, 48])
    check(phase, 'View absolute layout', initial.absolute, ['absolute', 12, 16])
    check(phase, 'initial class width', initial.width, 32)
    check(
      phase,
      'root Theme owns document scope',
      (await waitValue(page, 'rootTheme', 'tailwind-app-proof')).rootTheme,
      'tailwind-app-proof',
    )

    check(phase, 'breakpoint below 640', initial.responsive, '0.5')
    check(phase, 'nested theme token', initial.nested, 'rgb(171, 205, 239)')

    await page.getByTestId('toggle-width').click()

    const added = await waitValue(page, 'width', 48)

    check(phase, 'component adds class', added.width, 48)
    check(phase, 'old class is removed from host', added.widthClasses, ['w-12'])
    await page.getByTestId('toggle-width').click()

    const removed = await waitValue(page, 'width', 32)

    check(phase, 'component removes class', removed.width, 32)
    check(phase, 'replacement class is removed from host', removed.widthClasses, ['w-8'])
    await page.getByTestId('toggle-inline').click()
    check(phase, 'component adds inline width', (await waitValue(page, 'width', 56)).width, 56)
    await page.getByTestId('toggle-width').click()
    check(phase, 'inline width beats changed class', (await snapshot(page)).width, 56)
    await page.getByTestId('toggle-inline').click()
    check(
      phase,
      'inline removal restores current class',
      (await waitValue(page, 'width', 48)).width,
      48,
    )

    check(phase, 'inline width property is removed', (await snapshot(page)).inlineWidth, '')
    await page.getByTestId('toggle-width').click()
    await waitValue(page, 'width', 32)

    await page.setViewportSize({ width: 640, height: 800 })
    check(
      phase,
      'breakpoint includes 640',
      (await waitValue(page, 'responsive', '0.75')).responsive,
      '0.75',
    )

    await page.setViewportSize({ width: 639, height: 800 })
    await waitValue(page, 'responsive', '0.5')
    await page.getByTestId('toggle-mode').click()

    const dark = await waitValue(page, 'color', 'rgb(101, 67, 33)')

    check(phase, 'Theme mode changes generated color', dark.color, 'rgb(101, 67, 33)')
    check(phase, 'nested light Theme remains light', dark.nested, 'rgb(171, 205, 239)')
    check(
      phase,
      'Theme synchronizes document mode',
      (await waitValue(page, 'rootMode', 'dark')).rootMode,
      'dark',
    )

    await page.getByTestId('toggle-mode').click()
    await waitValue(page, 'color', 'rgb(18, 52, 86)')

    if (hmr) {
      const source = join(root, 'App.web.tsrx')
      const original = await readFile(source, 'utf8')

      assert.ok(original.includes('p-4 bg-primary rounded-lg'))
      try {
        await writeFile(
          source,
          original.replace('p-4 bg-primary rounded-lg', 'p-6 bg-primary rounded-lg'),
        )

        check(
          phase,
          'source edit reaches renderer and CSS',
          (await waitValue(page, 'padding', '24px')).padding,
          '24px',
        )
      } finally {
        await writeFile(source, original)
      }

      check(
        phase,
        'source restoration reaches renderer and CSS',
        (await waitValue(page, 'padding', '16px')).padding,
        '16px',
      )
    }
  } catch (error) {
    progress(`${phase}: failed: ${error.stack ?? error}`)
    throw error
  } finally {
    await context.close()
  }
}

try {
  progress('launch browser')
  browser = await chromium.launch({ headless: true })
  browserVersion = browser.version()

  const dev = await createServer({
    root,
    logLevel: 'silent',
    server: { host: '127.0.0.1', port: 0 },
  })

  try {
    await dev.listen()

    const address = dev.httpServer.address()

    assert.ok(address && typeof address === 'object')
    await qualify('development', `http://127.0.0.1:${address.port}/`, true)
  } finally {
    progress('development: closing server')
    await dev.close()
    progress('development: server closed')
  }

  progress('production: build')

  const built = await build({ root, logLevel: 'silent' })

  for (const bundle of Array.isArray(built) ? built : [built]) {
    for (const asset of bundle.output) {
      if (asset.type !== 'asset' || !asset.fileName.endsWith('.css')) {
        continue
      }

      const path = join(output, 'app-assets', asset.fileName)

      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, asset.source, { flag: 'wx' })
      assets.push({
        file: `app-assets/${asset.fileName}`,
        bytes: Buffer.byteLength(asset.source),
        sha256: createHash('sha256').update(asset.source).digest('hex'),
      })
    }
  }

  assert.ok(assets.length > 0, 'Production app must emit CSS')

  const production = await preview({
    root,
    logLevel: 'silent',
    preview: { host: '127.0.0.1', port: 0 },
  })

  try {
    const address = production.httpServer.address()

    assert.ok(address && typeof address === 'object')
    await qualify('production', `http://127.0.0.1:${address.port}/`)
  } finally {
    await new Promise((resolve) => production.httpServer.close(resolve))
  }
} catch (error) {
  failure = error.stack ?? String(error)
} finally {
  if (browser) {
    await browser.close()
  }
}

check('all', 'browser reports no runtime errors', errors, [])

const report = {
  schema: 1,
  evidence:
    'Fresh installed framework tarballs; actual Octane/UI app in headless Chromium, development HMR and production. DOM/style/layout and browser actions only; no screenshots, OS input or native runtime.',
  browserVersion,
  assets,
  observations,
  failure,
  passed: !failure && observations.every((item) => item.passed),
}

await writeFile(join(output, 'app.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' })
assert.ok(report.passed, failure ?? JSON.stringify(observations.filter((item) => !item.passed)))
console.log(
  JSON.stringify({
    report: join(output, 'app.json'),
    observations: observations.length,
    passed: true,
  }),
)
