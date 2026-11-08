// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { chromium, firefox, webkit } from 'playwright'
import { createServer } from 'vite'

const browserName = process.env.XPLAT_WEB_BROWSER ?? 'chromium'
const browserType = { chromium, firefox, webkit }[browserName]

if (!browserType) {
  throw new Error(`Unsupported XPLAT_WEB_BROWSER: ${browserName}`)
}

// A dedicated fixture and OS-assigned port: no screenshots or shared :5200.
const server = await createServer({
  root: fileURLToPath(new URL('..', import.meta.url)),
  server: { port: 0, host: '127.0.0.1', strictPort: true },
  plugins: [
    {
      name: 'input-readiness-fixture',
      configureServer(server) {
        server.middlewares.use('/__input_readiness', async (_req, res) => {
          res.setHeader('Content-Type', 'text/html')
          res.end(
            await server.transformIndexHtml(
              '/__input_readiness',
              '<div id="root"></div><script type="module" src="/test/input-readiness.web.tsrx"></script>',
            ),
          )
        })
      },
    },
  ],
})

let browser

try {
  await server.listen()
  browser = await browserType.launch({ headless: true })

  const page = await browser.newPage()

  page.setDefaultTimeout(120000)

  const errors = []

  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__input_readiness`)
  await page.waitForSelector('#action')

  const focused = () => page.evaluate(() => document.activeElement?.id)

  await page.keyboard.press('Tab')
  assert.equal(await focused(), 'action')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Space')
  assert.equal(await page.locator('#count').textContent(), '2')
  await page.keyboard.press('Tab')
  assert.equal(await focused(), 'input') // disabled action skipped
  await page.locator('#input').evaluate((input) => input.setSelectionRange(2, 4))
  await page.keyboard.type('XY')
  assert.equal(await page.locator('#input').inputValue(), 'heXYo')
  assert.equal(await page.locator('#changes').textContent(), '2')
  console.log(
    `${browserName}: keyboard actions, selection replacement, and controlled-write callback counts passed`,
  )

  assert.equal(await page.locator('#input').evaluate((input) => input.selectionStart), 4)
  await page.locator('#write').click()
  assert.equal(await page.locator('#input').inputValue(), 'replacement')
  assert.equal(await page.locator('#changes').textContent(), '2')

  for (const name of ['sheet', 'overlay']) {
    await page.locator(`#open-${name}`).click()
    await page.waitForFunction((id) => document.activeElement?.id === id, `${name}-first`)

    const dialogName = name === 'sheet' ? 'Input sheet' : 'Input overlay'

    assert.equal(await page.getByRole('dialog', { name: dialogName, exact: true }).count(), 1)
    assert.equal(await page.locator('#root').evaluate((root) => root.inert), true)
    await page.keyboard.press('Shift+Tab')
    assert.equal(await focused(), `${name}-last`)
    await page.keyboard.press('Tab')
    assert.equal(await focused(), `${name}-first`)
    // Playwright role locators include nodes inside inert roots. Test the
    // actual focus boundary here; Chromium's native AX tree check below
    // verifies assistive-tree exclusion separately.
    await page.locator('#action').evaluate((action) => action.focus())
    assert.equal(await focused(), `${name}-first`)
    if (browserName === 'chromium') {
      const session = await page.context().newCDPSession(page)
      const { nodes } = await session.send('Accessibility.getFullAXTree')

      assert.equal(
        nodes.some((node) => !node.ignored && node.name?.value === 'Save'),
        false,
      )

      await session.detach()
    }

    await page.locator(`#${name}-popover-trigger`).click()

    const option = page.locator(`#${name}-popover-option`)

    await option.click()
    assert.equal(await page.locator(`#${name}-popover-clicks`).textContent(), '1')
    assert.equal(await option.evaluate((node) => node.closest('[inert]') === null), true)
    assert.equal(await page.locator('#root').evaluate((root) => root.inert), true)
    await option.focus()
    await page.keyboard.press('Escape')
    await option.waitFor({ state: 'detached' })
    await page.waitForFunction(
      (id) => document.activeElement?.id === id,
      `${name}-popover-trigger`,
      { timeout: 10000 },
    )

    assert.equal(await page.getByRole('dialog', { name: dialogName, exact: true }).count(), 1)

    await page.keyboard.press('Escape')
    try {
      await page.waitForFunction((id) => document.activeElement?.id === id, `open-${name}`, {
        timeout: 10000,
      })
    } catch (error) {
      console.log(
        `${browserName}: ${name} focus restoration diagnostic`,
        await page.evaluate((modalName) => {
          const trigger = document.querySelector(`#open-${modalName}`)
          const active = document.activeElement

          return {
            activeElementId: active?.id,
            activeElement: active?.outerHTML,
            triggerConnected: trigger?.isConnected,
            triggerIsInert: trigger?.closest('[inert]') != null,
            rootInert: document.getElementById('root')?.inert,
            modalLayers: [...document.querySelectorAll('.vx-sheet-layer, .vx-overlay-layer')]
              .length,
          }
        }, name),
      )

      throw error
    }

    assert.equal(await page.locator('#root').evaluate((root) => root.inert), false)
    console.log(
      `${browserName}: ${name} Tab cycle, inert background exclusion, Escape, and focus restoration passed`,
    )
  }

  const sheetOpener = page.locator('#open-sheet')

  await sheetOpener.focus()
  await sheetOpener.press('Enter')
  try {
    await page.waitForFunction(() => document.activeElement?.id === 'sheet-first', null, {
      timeout: 10000,
    })
  } catch (error) {
    console.log(
      'Reopen diagnostic:',
      await page.evaluate(() => ({
        focus: document.activeElement?.id,
        sheets: [...document.querySelectorAll('.vx-sheet-layer')].map((node) => node.outerHTML),
        backgroundInert: document.getElementById('root').inert,
      })),
      errors,
    )

    throw error
  }

  await page.locator('#sheet-nested').click()
  await page.waitForFunction(() => document.activeElement?.id === 'overlay-first')
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => document.activeElement?.id === 'sheet-nested', null, {
    timeout: 10000,
  })

  assert.equal(await page.locator('#root').evaluate((root) => root.inert), true)
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => document.activeElement?.id === 'open-sheet', null, {
    timeout: 10000,
  })

  await page.locator('#presence-input').focus()
  // Invoke the exit control without transferring input focus first.
  await page.locator('#exit').evaluate((button) => button.click())
  await page.waitForFunction(() => document.querySelector('#presence-input')?.closest('[inert]'))
  assert.notEqual(await focused(), 'presence-input')
  assert.equal(
    await page
      .locator('#presence-input')
      .evaluate((input) => input.closest('[aria-hidden="true"]') !== null),
    true,
  )

  await page.locator('#reverse').click()
  await page.waitForFunction(() => !document.querySelector('#presence-input')?.closest('[inert]'))
  await page.locator('#presence-input').focus()
  assert.equal(await focused(), 'presence-input')
  await page.locator('#open-command-palette').click()
  await page.waitForFunction(
    () => document.activeElement?.classList.contains('vx-cmdk-search'),
    null,
    {
      timeout: 10000,
    },
  )

  assert.equal(await page.getByRole('dialog', { name: 'Command palette', exact: true }).count(), 1)
  await page.keyboard.press('Escape')
  try {
    await page.waitForFunction(() => document.activeElement?.id === 'open-command-palette', null, {
      timeout: 10000,
    })
  } catch (error) {
    console.error(
      `${browserName}: CommandPalette focus restoration diagnostic`,
      await page.evaluate(() => ({
        activeElement: document.activeElement?.outerHTML,
        triggerConnected: document.getElementById('open-command-palette')?.isConnected,
        triggerInert: document.getElementById('open-command-palette')?.closest('[inert]') != null,
        rootInert: document.getElementById('root')?.inert,
        dialogs: [...document.querySelectorAll('[role="dialog"]')].map(
          (dialog) => dialog.outerHTML,
        ),
      })),
    )

    throw error
  }

  await page.locator('#slider-before').focus()
  await page.keyboard.press('Tab')
  assert.equal(await focused(), 'volume')
  for (const [key, expected] of [
    ['ArrowRight', 0.51],
    ['Home', 0],
    ['ArrowDown', 0],
    ['End', 1],
    ['ArrowUp', 1],
    ['ArrowLeft', 0.99],
  ]) {
    await page.keyboard.press(key)
    await page.waitForFunction(
      (value) => Number(document.getElementById('volume')?.getAttribute('aria-valuenow')) === value,
      expected,
    )
  }

  await page.keyboard.press('Tab')
  assert.equal(await focused(), 'slider-after')

  // An ancestor onPan observes the drag but must not claim the pointer before
  // the pan slop is crossed — a stationary click on a nested control still
  // activates it, while a real drag produces pan events and no click.
  const nested = page.locator('#pan-nested')
  const nestedBox = await nested.boundingBox()

  assert.ok(nestedBox)

  const nestedX = nestedBox.x + nestedBox.width / 2
  const nestedY = nestedBox.y + nestedBox.height / 2

  await nested.click()
  assert.equal(await page.locator('#pan-presses').textContent(), '1')

  // Sub-slop jitter between down and up is still a click.
  await page.mouse.move(nestedX, nestedY)
  await page.mouse.down()
  await page.mouse.move(nestedX + 3, nestedY)
  await page.mouse.up()
  assert.equal(await page.locator('#pan-presses').textContent(), '2')

  await page.mouse.move(nestedX, nestedY)
  await page.mouse.down()
  await page.mouse.move(nestedX + 40, nestedY, { steps: 4 })
  await page.mouse.up()
  assert.equal(await page.locator('#pan-presses').textContent(), '2')

  const panStates = (await page.locator('#pan-log').textContent())?.split(',') ?? []
  const lastBegan = panStates.lastIndexOf('began')

  assert.ok(lastBegan >= 0)
  assert.deepEqual(
    panStates.slice(lastBegan).filter((state) => state !== 'moved'),
    ['began', 'ended'],
  )

  assert.ok(panStates.slice(lastBegan).includes('moved'))

  // A drag on a Pressable that owns the pan itself is not an activation.
  const self = page.locator('#pan-self')
  const selfBox = await self.boundingBox()

  assert.ok(selfBox)

  const selfX = selfBox.x + selfBox.width / 2
  const selfY = selfBox.y + selfBox.height / 2

  await self.click()
  assert.equal(await page.locator('#pan-self-presses').textContent(), '1')

  await page.mouse.move(selfX, selfY)
  await page.mouse.down()
  await page.mouse.move(selfX + 40, selfY, { steps: 4 })
  await page.mouse.up()
  assert.equal(await page.locator('#pan-self-presses').textContent(), '1')

  const selfStates = (await page.locator('#pan-self-log').textContent())?.split(',') ?? []
  const lastSelfBegan = selfStates.lastIndexOf('began')

  assert.ok(lastSelfBegan >= 0)
  assert.deepEqual(
    selfStates.slice(lastSelfBegan).filter((state) => state !== 'moved'),
    ['began', 'ended'],
  )

  assert.ok(selfStates.slice(lastSelfBegan).includes('moved'))

  assert.deepEqual(errors, [])
  console.log(
    `Input readiness: ${browserName} keyboard, selection, controlled writes, modal focus/accessibility isolation, and Presence reversal passed. IME and screen readers were not exercised.`,
  )
} catch (error) {
  console.error('Input readiness failed', error)
  process.exitCode = 1
} finally {
  try {
    await browser?.close()
  } finally {
    await server.close()
  }
}
