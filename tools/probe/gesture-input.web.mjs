import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { appFor, importFrom, repo } from './project.ts'

const { createServer } = await importFrom(appFor('web'), 'vite')
const { chromium, firefox, webkit } = await importFrom(appFor('web'), 'playwright')
const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('./fixtures/gesture-owner/', import.meta.url)),
  server: { host: '127.0.0.1', port: 0, fs: { allow: [repo] } },
})

await server.listen()
try {
  const url = server.resolvedUrls.local[0]

  for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await engine.launch({ headless: true })

    try {
      const page = await browser.newPage()
      const errors = []

      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(url)

      const button = page.locator('#action')
      const state = () => page.locator('#state').textContent().then(JSON.parse)

      await button.click()
      assert.equal((await state()).clicks, 1, `${name}: stationary nested click`)

      const bounds = await button.boundingBox()
      const x = bounds.x + bounds.width / 2,
        y = bounds.y + bounds.height / 2

      await page.mouse.move(x, y)
      await page.mouse.down()
      await page.mouse.move(x + 60, y, { steps: 12 })
      await page.mouse.up()

      let result = await state()

      assert.equal(result.starts, 1, `${name}: one activation`)
      assert.equal(result.ends, 1, `${name}: one completed drag`)
      assert.equal(result.clicks, 1, `${name}: moving panel consumes trailing click`)
      assert.ok(Math.abs(result.x - 60) < 1, `${name}: movement independent of translated host`)
      await button.focus()
      await page.keyboard.press('Enter')
      assert.equal((await state()).clicks, 2, `${name}: keyboard activation after drag`)
      await button.click()
      assert.equal((await state()).clicks, 3, `${name}: next independent click`)

      const next = await button.boundingBox()

      await page.mouse.move(next.x + 20, next.y + 20)
      await page.mouse.down()
      await page.mouse.move(next.x + 60, next.y + 20, { steps: 4 })
      // This deliberately invokes capture loss; it is not an OS interruption test.
      await page.evaluate(() => {
        const panel = document.querySelector('#panel')

        for (let id = 0; id < 10; id++) {
          if (panel.hasPointerCapture(id)) {
            panel.releasePointerCapture(id)
          }
        }
      })

      await page.mouse.move(next.x + 65, next.y + 20)
      await page.mouse.up()
      result = await state()
      assert.equal(result.cancels, 1, `${name}: capture loss cancels`)
      assert.equal(result.ends, 1, `${name}: capture loss does not complete drag`)
      await button.focus()
      await page.keyboard.press('Enter')
      assert.equal((await state()).clicks, 4, `${name}: keyboard survives cancellation`)

      const scopedButton = page.locator('#frozen-action')

      await page.locator('#freeze').click()
      await page.locator('#freeze').click()
      assert.equal((await state()).leases, 2, `${name}: overlapping suspension leases`)
      assert.equal((await state()).scopeFailure, '', `${name}: non-scrolling subtree can suspend`)

      const scopedBounds = await scopedButton.boundingBox()

      await page.mouse.click(scopedBounds.x + 30, scopedBounds.y + 20)
      assert.equal(
        (await state()).scopePresses,
        0,
        `${name}: inert scope rejects real mouse activation`,
      )

      await scopedButton.evaluate((node) => node.click())
      assert.equal(
        (await state()).scopePresses,
        0,
        `${name}: suspended scope rejects virtual activation`,
      )

      await page.locator('#release').click()
      assert.equal(
        await page.locator('#frozen-content').evaluate((node) => node.inert),
        true,
        `${name}: one release preserves another owner's lock`,
      )

      await page.locator('#release').click()
      await scopedButton.focus()
      await page.keyboard.press('Enter')
      assert.equal(
        (await state()).scopePresses,
        1,
        `${name}: independent keyboard activation after restoration`,
      )

      const viewport = page.locator('#scroll-viewport')

      await viewport.scrollIntoViewIfNeeded()
      assert.equal(
        await viewport.evaluate((node) => node.style.touchAction),
        'pan-y pinch-zoom',
        `${name}: reservation on actual viewport`,
      )

      const scrollBounds = await viewport.boundingBox()

      await page.mouse.move(scrollBounds.x + 50, scrollBounds.y + 50)
      await page.mouse.wheel(0, 240)
      await page.waitForFunction(
        () => JSON.parse(document.querySelector('#state').textContent).scrollY > 20,
      )

      assert.ok(
        (await state()).scrollY > 20,
        `${name}: vertical browser wheel scrolling remains available`,
      )

      await page.mouse.down()
      await page.mouse.move(scrollBounds.x + 110, scrollBounds.y + 50, { steps: 6 })
      await page.mouse.up()
      assert.equal(
        (await state()).revealStarts,
        1,
        `${name}: horizontal parent claims over a vertical viewport`,
      )

      assert.deepEqual(errors, [], `${name}: no page errors`)
      console.log(
        JSON.stringify({
          target: name,
          evidence: 'browser mouse/keyboard/wheel input; virtual click and capture-loss API calls',
          status: 'pass',
          assertions: 20,
        }),
      )
    } finally {
      await browser.close()
    }
  }
} finally {
  await server.close()
}
