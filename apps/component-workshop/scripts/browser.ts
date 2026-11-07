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
  await page.waitForSelector('.xw-gallery section')
  assert.equal(await page.locator('.xw-gallery section').count(), Object.keys(catalog).length)
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
    await page
      .locator(`section[id="component=${encodeURIComponent(catalog[name].package + '#' + name)}"]`)
      .scrollIntoViewIfNeeded()

    await page.waitForTimeout(180)
    assert.ok((await page.locator('iframe').count()) <= 8, 'active preview budget exceeded')
  }

  await page.getByRole('searchbox').fill('ColorPicker')
  assert.equal(await page.locator('section:visible').count(), 1)
  await page.getByRole('searchbox').fill('not-a-component')
  assert.equal(await page.locator('section:visible').count(), 0)
  assert.deepEqual(errors, [], 'gallery errors')
  await page.getByRole('searchbox').fill('')
  await page.goto(`${base}?view=story&story=button/basic`)
  await page.getByRole('link', { name: 'Gallery', exact: true }).waitFor()
  await page.goBack()
  await page.waitForSelector('.xw-gallery')
  await page.locator('.xw-gallery section').first().scrollIntoViewIfNeeded()
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
