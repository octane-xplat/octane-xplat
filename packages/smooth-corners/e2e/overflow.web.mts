// DOM style, geometry and browser hit-testing only; no image capture.
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { chromium, firefox, webkit } from 'playwright'
import { createServer } from 'vite'
import { octane } from 'octane/compiler/vite'

const server = await createServer({
  configFile: false,
  root: process.env.XPLAT_SMOOTH_FIXTURE ?? fileURLToPath(new URL('./fixture', import.meta.url)),
  plugins: [octane({ ssr: false })],
  optimizeDeps: { exclude: ['@octane-xplat/smooth-corners'] },
  resolve: {
    conditions: ['web'],
    dedupe: ['octane'],
    extensions: ['.web.tsrx', '.tsrx', '.web.ts', '.ts', '.mjs', '.js', '.json'],
  },
  server: { host: '127.0.0.1', port: 0 },
})

let browser

try {
  await server.listen()

  const engine = { chromium, firefox, webkit }[process.env.XPLAT_WEB_BROWSER ?? 'chromium']

  if (!engine) {
    throw new Error('Unsupported XPLAT_WEB_BROWSER')
  }

  browser = await engine.launch({ headless: true })

  const page = await browser.newPage()

  page.setDefaultTimeout(15000)

  const errors = []

  page.on('pageerror', (error) => {
    errors.push(error.message)
    console.error(error.message)
  })

  // Cold Vite compilation can overlap type generation on shared hosts.
  await page.goto(server.resolvedUrls.local[0], { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() =>
    document.querySelector('#panel [aria-hidden] div')?.style.clipPath.startsWith('path('),
  )

  const read = () =>
    page.evaluate(() => {
      const panel = document.getElementById('panel')
      const paint = panel.querySelector('[aria-hidden] div')
      const bounds = panel.getBoundingClientRect()
      const badge = document.getElementById('badge').getBoundingClientRect()

      return {
        overflow: getComputedStyle(panel).overflow,
        clip: getComputedStyle(panel).clipPath,
        background: getComputedStyle(panel).backgroundColor,
        surfaceBackground: getComputedStyle(paint).backgroundColor,
        surfaceClip: getComputedStyle(paint).clipPath,
        surfaceRadius: getComputedStyle(paint).borderRadius,
        surfaceBorder: getComputedStyle(paint).borderTopWidth,
        width: bounds.width,
        shadowWidth: panel.parentElement.querySelector('svg > path').getBBox().width,
        shadowTransform: panel.parentElement.querySelector('svg > path').getAttribute('transform'),
        badgeReachable: document.elementFromPoint(badge.right - 5, badge.top + 10)?.id === 'badge',
        shadowOutsideClip: panel.parentElement.querySelector('svg > defs > filter') !== null,
      }
    })

  const geometry = await page.evaluate(() => {
    const percent = document.getElementById('percent')
    const classOnly = document.getElementById('class-only')
    const transformed = document.getElementById('transformed')

    return {
      percent: percent.offsetWidth,
      percentOuter: percent.parentElement.offsetWidth,
      classOnly: classOnly.offsetWidth,
      classOuter: classOnly.parentElement.offsetWidth,
      transformed: transformed.getBoundingClientRect().width,
      contentOpacity: getComputedStyle(transformed).opacity,
      outerOpacity: getComputedStyle(transformed.parentElement).opacity,
    }
  })

  assert.equal(geometry.percent, 200)
  assert.equal(geometry.percentOuter, 200)
  assert.equal(geometry.classOnly, 200)
  assert.equal(geometry.classOuter, 200)
  assert.ok(Math.abs(geometry.transformed - 240) < 0.1)
  assert.equal(geometry.contentOpacity, '1')
  assert.equal(geometry.outerOpacity, '0.5')

  const initial = await read()

  assert.equal(initial.overflow, 'visible')
  assert.equal(initial.clip, 'none')
  assert.equal(initial.background, 'rgba(0, 0, 0, 0)')
  assert.equal(initial.surfaceBackground, 'rgb(219, 234, 254)')
  assert.ok(initial.surfaceClip.startsWith('path('))
  assert.equal(initial.surfaceRadius, '0px')
  assert.equal(initial.surfaceBorder, '0px')
  assert.equal(initial.badgeReachable, true)
  assert.equal(initial.shadowOutsideClip, true)
  assert.ok(Math.abs(initial.shadowWidth - (initial.width + 4)) < 0.01)
  assert.equal(initial.shadowTransform, 'translate(-2 -2)')
  await page.locator('#badge').click({ position: { x: 65, y: 10 } })
  assert.equal(await page.locator('#clicks').textContent(), '1')

  await page.locator('#hide').click()
  await page.waitForFunction(() =>
    document.getElementById('panel').style.clipPath.startsWith('path('),
  )

  const hidden = await read()

  assert.equal(hidden.badgeReachable, false)
  assert.equal(hidden.clip, hidden.surfaceClip)
  assert.equal(hidden.width, initial.width)
  assert.equal(hidden.shadowOutsideClip, true)

  await page.locator('#resize').click()
  await page.waitForFunction(() => document.getElementById('panel').offsetWidth === 260)
  await page.waitForFunction(() => document.getElementById('panel').style.clipPath.includes('260'))

  const resized = await read()

  assert.notEqual(resized.surfaceClip, initial.surfaceClip)
  assert.equal(resized.clip, resized.surfaceClip)

  await page.locator('#show').click()
  await page.waitForFunction(
    () => getComputedStyle(document.getElementById('panel')).clipPath === 'none',
  )

  await page.locator('#reset').click()
  await page.locator('#class-clip').click()
  await page.waitForFunction(() =>
    document.getElementById('panel').style.clipPath.startsWith('path('),
  )

  await page.locator('#class-clip').click()
  await page.waitForFunction(
    () => getComputedStyle(document.getElementById('panel')).clipPath === 'none',
  )

  // Bamboo emits layered utilities — a framework overflow default must not
  // outrank an authored layered class in the browser cascade (issue #204).
  await page.locator('#class-clip-layered').click()
  await page.waitForFunction(
    () =>
      getComputedStyle(document.getElementById('panel')).overflow === 'hidden' &&
      document.getElementById('panel').style.clipPath.startsWith('path('),
  )

  await page.locator('#class-clip-layered').click()
  await page.waitForFunction(
    () => getComputedStyle(document.getElementById('panel')).clipPath === 'none',
  )

  assert.deepEqual(errors, [])
  console.log(
    'SmoothCorners web: default visibility, child hit-testing, hidden clip, unlayered and layered class removal, resize and shadow separation passed.',
  )
} finally {
  await browser?.close()
  await server.close()
}
