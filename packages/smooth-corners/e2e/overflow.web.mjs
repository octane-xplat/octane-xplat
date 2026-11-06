// DOM style, geometry and browser hit-testing only; no image capture.
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { octane } from 'octane/compiler/vite'

const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('./fixture', import.meta.url)),
  plugins: [octane({ ssr: false })],
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
  browser = await chromium.launch({ headless: true })
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
        width: bounds.width,
        badgeReachable: document.elementFromPoint(badge.right - 5, badge.top + 10)?.id === 'badge',
        shadowOutsideClip: panel.parentElement.querySelector('svg > defs > filter') !== null,
      }
    })

  const initial = await read()
  assert.equal(initial.overflow, 'visible')
  assert.equal(initial.clip, 'none')
  assert.equal(initial.background, 'rgba(0, 0, 0, 0)')
  assert.equal(initial.surfaceBackground, 'rgb(219, 234, 254)')
  assert.ok(initial.surfaceClip.startsWith('path('))
  assert.equal(initial.badgeReachable, true)
  assert.equal(initial.shadowOutsideClip, true)
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

  assert.deepEqual(errors, [])
  console.log(
    'SmoothCorners web: default visibility, child hit-testing, hidden clip, class removal, resize and shadow separation passed.',
  )
} finally {
  await browser?.close()
  await server.close()
}
