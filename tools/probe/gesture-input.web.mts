import assert from 'node:assert/strict'
import { packedGestureFixture } from './gesture-packed-fixture.mts'
import { fileURLToPath } from 'node:url'
import { appFor, importFrom, repo } from './project.ts'

const { createServer } = await importFrom(appFor('web'), 'vite')
const { chromium, firefox, webkit } = await importFrom(appFor('web'), 'playwright')
const { tsrx } = await importFrom(appFor('web'), '@octane-xplat/cli/vite')
const { octane } = await importFrom(appFor('web'), 'octane/compiler/vite')
const fixture = fileURLToPath(new URL('./fixtures/gesture-owner/', import.meta.url))
const packed = process.argv.includes('--packed') ? packedGestureFixture(repo, fixture) : null
const server = await createServer({
  plugins: [tsrx('web'), octane({ ssr: false })],
  resolve: {
    conditions: ['web'],
    extensions: ['.web.tsrx', '.tsrx', '.web.ts', '.ts', '.mjs', '.js', '.json'],
  },
  optimizeDeps: {
    noDiscovery: true,
    include: [
      'octane',
      'octane/internal/client',
      'octane/signals',
      'octane/signals/client',
      'motion-dom',
    ],
    exclude: ['@octane-xplat/ui', '@octane-xplat/motion'],
  },
  configFile: false,
  root: packed?.root ?? fixture,
  server: {
    host: '127.0.0.1',
    port: 0,
    fs: { allow: [repo, ...(packed ? [packed.directory] : [])] },
  },
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
      page.on('requestfailed', (request) =>
        errors.push(`${request.url()}: ${request.failure()?.errorText}`),
      )

      page.on('console', (message) => {
        if (message.type() === 'error') {
          errors.push(message.text())
        }
      })

      const response = await page.goto(url)

      if (response.status() !== 200) {
        throw new Error(
          `${name}: fixture HTTP ${response.status()}: ${(await response.text()).slice(0, 1000)}`,
        )
      }

      await page.waitForSelector('#action', { timeout: 15000 }).catch(async (error) => {
        throw new Error(
          `${name}: fixture failed to mount: ${errors.join('; ')}; body=${(await page.locator('body').innerText()).slice(0, 1000)}; ${error.message}`,
        )
      })

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

      const motion = page.locator('#motion-action')

      await motion.scrollIntoViewIfNeeded()

      const motionBounds = await motion.boundingBox()

      await page.mouse.move(motionBounds.x + 30, motionBounds.y + 20)
      await page.mouse.down()
      await page.mouse.move(motionBounds.x + 90, motionBounds.y + 20, { steps: 8 })
      await page.mouse.up()
      assert.equal((await state()).motionStarts, 1, `${name}: Motion uses the shared owner`)
      assert.equal((await state()).motionPresses, 0, `${name}: Motion drag rejects the child press`)
      await motion.click()
      assert.equal((await state()).motionPresses, 1, `${name}: fresh Motion child tap`)

      await page.locator('#native-checkbox').check()
      assert.equal(
        await page.locator('#native-checkbox').isChecked(),
        true,
        `${name}: native checkbox default survives its Pressable ancestor`,
      )

      await page.locator('#native-button').click()
      assert.equal((await state()).nativeClicks, 1, `${name}: native child action`)
      assert.equal(
        (await state()).rawPresses,
        0,
        `${name}: native child never activates the semantic ancestor`,
      )

      const scaled = page.locator('#scaled-panel')

      await scaled.scrollIntoViewIfNeeded()

      const beforeScaled = await scaled.boundingBox()
      const scaledX = beforeScaled.x + beforeScaled.width / 2,
        scaledY = beforeScaled.y + beforeScaled.height / 2

      await page.mouse.move(scaledX, scaledY)
      await page.mouse.down()
      await page.mouse.move(scaledX + 60, scaledY, { steps: 8 })
      await page.mouse.up()

      const afterScaled = await scaled.boundingBox()

      assert.equal((await state()).scaledStarts, 1, `${name}: scaled Motion host claims once`)
      assert.ok(
        Math.abs(afterScaled.x - beforeScaled.x - 60) < 1,
        `${name}: scaled drag follows the window pointer in parent channel units`,
      )

      const immediate = page.locator('#immediate-effect')

      await immediate.click()
      assert.equal((await state()).immediate, 1, `${name}: synchronous effect runs once`)
      assert.equal(
        await immediate.getAttribute('aria-busy'),
        null,
        `${name}: effect never becomes busy`,
      )

      const managed = page.locator('#managed-action')

      await managed.click()
      assert.equal((await state()).actionEffects, 1, `${name}: effect precedes managed action`)
      assert.equal((await state()).actionStarts, 1, `${name}: managed action starts once`)
      assert.equal(
        await managed.getAttribute('aria-busy'),
        'true',
        `${name}: managed action is busy`,
      )

      assert.equal(await managed.isDisabled(), true, `${name}: pending action blocks presses`)
      await page.waitForFunction(
        () => JSON.parse(document.querySelector('#state').textContent).actionEnds === 1,
      )

      assert.equal(await managed.isDisabled(), false, `${name}: settled action restores activation`)
      await managed.focus()
      await page.keyboard.press('Enter')
      assert.equal((await state()).actionStarts, 2, `${name}: keyboard invokes the same action`)
      await page.waitForFunction(
        () => JSON.parse(document.querySelector('#state').textContent).actionEnds === 2,
      )

      assert.deepEqual(errors, [], `${name}: no page errors`)
      console.log(
        JSON.stringify({
          target: name,
          packages: packed ? { mode: 'packed', sha256: packed.hashes } : { mode: 'linked-source' },
          evidence: 'browser mouse/keyboard/wheel input; virtual click and capture-loss API calls',
          status: 'pass',
          assertions: 36,
        }),
      )
    } finally {
      await browser.close()
    }
  }
} finally {
  await server.close()
  packed?.dispose()
}
