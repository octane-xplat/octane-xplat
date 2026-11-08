import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('..', import.meta.url))
const catalog: Record<string, { package: string; capabilities?: string[] }> = JSON.parse(
  readFileSync(resolve(root, 'catalog.json'), 'utf8'),
)

const mime: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
}

const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
  let file = resolve(
    root,
    'dist',
    pathname.replace(/^\/workshop\//, '').replace(/^\/template-assets\//, 'template-assets/'),
  )

  if (file !== resolve(root, 'dist') && !file.startsWith(resolve(root, 'dist') + '/')) {
    res.writeHead(404).end()
    return
  }

  if (existsSync(file) && statSync(file).isDirectory()) {
    file = resolve(file, 'index.html')
  }

  if (!existsSync(file)) {
    res.writeHead(404).end()
    return
  }

  res.setHeader('content-type', mime[extname(file)] ?? 'application/octet-stream')
  res.end(readFileSync(file))
})

await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))

const address = server.address()

if (!address || typeof address === 'string') {
  throw new Error('Missing test address')
}

const base = `http://127.0.0.1:${address.port}/workshop/`
let browser

try {
  browser = await chromium.launch({ headless: true })

  const page = await browser.newPage()
  const errors: string[] = []

  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(base)
  await page.waitForSelector('.xw-gallery section:visible')
  assert.equal(
    await page.locator('html').evaluate((node) => getComputedStyle(node).colorScheme),
    'light',
  )

  assert.equal(await page.locator('.xw-gallery section').count(), Object.keys(catalog).length)

  const components = page.getByRole('tab', { name: 'Components', exact: true })
  const primitives = page.getByRole('tab', { name: 'Primitives', exact: true })

  assert.equal(await components.getAttribute('aria-selected'), 'true')

  const componentCount = await page.locator('section[data-group="components"]').count()
  const primitiveCount = await page.locator('section[data-group="primitives"]').count()

  assert.ok(componentCount > 0 && primitiveCount > 0)
  assert.equal(componentCount + primitiveCount, Object.keys(catalog).length)
  assert.equal(await page.locator('section:visible').count(), componentCount)
  await page.getByRole('searchbox').fill('VStack')
  assert.equal(await page.locator('section:visible').count(), 0)
  await primitives.click()
  assert.equal(await page.getByRole('searchbox').inputValue(), 'VStack')
  assert.equal(await page.locator('section:visible').count(), 1)
  assert.equal(await page.locator('nav[aria-label="Component index"] a:not([hidden])').count(), 1)
  await page.getByRole('searchbox').fill('')
  await page.reload()
  assert.equal(await primitives.getAttribute('aria-selected'), 'true')
  assert.equal(await page.locator('section:visible').count(), primitiveCount)
  await primitives.focus()
  await page.keyboard.press('ArrowLeft')
  assert.equal(await components.getAttribute('aria-selected'), 'true')
  await page.keyboard.press('End')
  assert.equal(await primitives.getAttribute('aria-selected'), 'true')
  await page.keyboard.press('Home')
  assert.equal(await components.getAttribute('aria-selected'), 'true')
  await page.waitForFunction(() => document.querySelectorAll('iframe').length > 0)
  assert.ok(
    (await page.locator('iframe').count()) < 8,
    'initial page must not eagerly activate the catalog',
  )

  for (const name of [
    'ColorPicker',
    'Button',
    'MarkdownScreen',
    'Timeline',
    'Tabs',
    'GridList',
    'InputRating',
    'Chip',
    'PinInput',
    'Meter',
    'NavLink',
    'ToastViewport',
  ]) {
    const card = page.locator(
      `section[id="component=${encodeURIComponent(catalog[name].package + '#' + name)}"]`,
    )

    const group = await card.getAttribute('data-group')

    await (group === 'primitives' ? primitives : components).click()
    await card.scrollIntoViewIfNeeded()

    await page.waitForTimeout(180)
    assert.ok((await page.locator('iframe').count()) <= 8, 'active preview budget exceeded')
  }

  await page.getByRole('searchbox').fill('ColorPicker')
  assert.equal(await page.locator('section:visible').count(), 1)
  await page.getByRole('searchbox').fill('not-a-component')
  assert.equal(await page.locator('section:visible').count(), 0)
  assert.deepEqual(errors, [], 'gallery errors')
  await page.getByRole('button', { name: 'Clear search', exact: true }).click()
  assert.equal(await page.getByRole('searchbox').inputValue(), '')
  assert.equal(await page.locator('section:visible').count(), componentCount)
  assert.equal(
    await page.getByRole('searchbox').evaluate((node) => node === document.activeElement),
    true,
  )

  for (const width of [320, 390, 640, 800, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `gallery overflows a ${width}px viewport`,
    )
  }

  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  assert.ok(
    await page
      .getByRole('searchbox')
      .evaluate(
        (node) => node.matches(':focus-visible') && getComputedStyle(node).outlineStyle !== 'none',
      ),
    'search must retain visible keyboard focus',
  )

  await page.goto(`${base}#component=${encodeURIComponent('@octane-xplat/ui#Text')}`)
  await page
    .locator('section[id="component=%40octane-xplat%2Fui%23Text"]')
    .waitFor({ state: 'visible' })

  assert.equal(await primitives.getAttribute('aria-selected'), 'true')

  await page.goto(`${base}?view=story&story=button/basic`)
  await page.getByRole('link', { name: 'Gallery', exact: true }).waitFor()
  await page.goBack()
  await page.waitForSelector('.xw-gallery')
  await page.locator('.xw-gallery section:visible').first().scrollIntoViewIfNeeded()
  await page.waitForFunction(() => document.querySelectorAll('.xw-gallery iframe').length > 0)

  // Exercise every representative in its actual compiled frame, without image capture.
  const failures: string[] = []
  const runnable = Object.keys(catalog).filter((key) => !catalog[key].capabilities?.length)

  for (const name of runnable) {
    await page.addInitScript(() => {
      window.addEventListener('message', (event) => {
        if (
          event.origin === location.origin &&
          event.data?.workshop === 1 &&
          ['ready', 'error'].includes(event.data.type)
        ) {
          {
            document.documentElement.dataset.preview = event.data.type
            document.documentElement.dataset.previewError = event.data.message ?? ''
          }
        }
      })
    })

    errors.length = 0
    await page.goto(`${base}?view=frame&story=${name.toLowerCase()}/basic`)
    try {
      await page.waitForFunction(
        () => ['ready', 'error'].includes(document.documentElement.dataset.preview ?? ''),
        { timeout: 10000 },
      )

      assert.equal(
        await page.locator('section[id^="component="]').count(),
        0,
        'preview retained the static catalog fallback',
      )

      if (name === 'Button') {
        const primary = page.getByRole('button', { name: 'Primary', exact: true })

        assert.equal(
          await primary.evaluate((node) => getComputedStyle(node).backgroundColor),
          'rgb(0, 100, 224)',
        )

        assert.equal(await primary.evaluate((node) => getComputedStyle(node).borderRadius), '8px')
        assert.ok(
          await page
            .locator('body')
            .evaluate((node) => getComputedStyle(node).fontFamily.includes('system-ui')),
        )
      }

      if (name === 'NavLink') {
        await page.getByRole('link', { name: 'Open a local route' }).click()
        await page.getByText('Example destination', { exact: true }).waitFor()
      }

      if (name === 'RouteOutlet') {
        await page.getByText('Content inside the nested route outlet', { exact: true }).waitFor()
      }

      if (name === 'pager-Pager') {
        await page.getByRole('button', { name: 'Next page' }).click()
        await page.getByText('Selected page: 2', { exact: true }).waitFor()
      }

      if (name === 'gif-AnimatedImage') {
        await page.getByRole('button', { name: 'Play animation', exact: true }).click()
        await page.waitForFunction(() =>
          [...document.images].some((image) => image.complete && image.naturalWidth === 2),
        )
      }

      if ((await page.locator('html').getAttribute('data-preview')) !== 'ready' || errors.length) {
        failures.push(
          `${name}: ${errors.join('; ') || (await page.locator('html').getAttribute('data-preview-error')) || (await page.locator('body').innerText()).slice(-400)}`,
        )
      }
    } catch (error) {
      failures.push(`${name}: ${String(error).slice(0, 400)}`)
    }
  }

  assert.deepEqual(failures, [], 'representative story failures')
  console.log(
    `Browser: lazy gallery, search, scroll budget and ${runnable.length} representatives passed; ${Object.keys(catalog).length - runnable.length} prerequisite entries stayed inactive`,
  )
} finally {
  await browser?.close()
  await new Promise<void>((done, reject) =>
    server.close((error) => (error ? reject(error) : done())),
  )
}
