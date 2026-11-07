import assert from 'node:assert/strict'
import { chromium } from 'playwright'

interface PublishedWorkshopBuild {
  revision: string
  components: number
}

function publishedBuild(value: unknown): PublishedWorkshopBuild {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('revision' in value) ||
    typeof value.revision !== 'string' ||
    !('components' in value) ||
    typeof value.components !== 'number' ||
    !Number.isSafeInteger(value.components) ||
    value.components < 0
  ) {
    throw new Error('Invalid published Workshop build metadata')
  }
  return { revision: value.revision, components: value.components }
}

const [address, revision] = process.argv.slice(2)
if (!address || !revision) {
  throw new Error('Usage: verify-deployment.ts WORKSHOP_URL EXPECTED_GIT_REVISION')
}

const url = new URL(address)
if (url.username || url.password || !['http:', 'https:'].includes(url.protocol)) {
  throw new Error('Expected a public HTTP(S) Workshop URL')
}

const manifestResponse = await fetch(new URL('workshop-build.json', url))
assert.equal(manifestResponse.status, 200)
assert.match(manifestResponse.headers.get('content-type') ?? '', /json/)
const manifest = publishedBuild(await manifestResponse.json())
assert.equal(manifest.revision, revision)
const html = await (await fetch(url)).text()
const script = /<script[^>]+src="([^"]+)"/.exec(html)?.[1]
assert.ok(script, 'Workshop HTML has no entry script')
const scriptResponse = await fetch(new URL(script, url))
assert.equal(scriptResponse.status, 200)
assert.match(scriptResponse.headers.get('content-type') ?? '', /javascript/)

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage()
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 400 && new URL(response.url()).origin === url.origin) {
      errors.push(`HTTP ${response.status()}: ${new URL(response.url()).pathname}`)
    }
  })

  await page.goto(url.href)
  await page.waitForSelector('.xw-gallery section')
  assert.equal(await page.locator('.xw-gallery section').count(), manifest.components)
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.xw-gallery section [role="status"]')].some(
      (status) => status.textContent === 'Ready',
    ),
  )

  const count = await page.locator('iframe').count()
  assert.ok(count > 0 && count <= 8)
  const search = page.getByRole('searchbox')
  await search.fill('ColorPicker')
  assert.equal(await page.locator('section:visible').count(), 1)
  await page.locator('section:visible').scrollIntoViewIfNeeded()
  await page.locator('section:visible').getByRole('status').filter({ hasText: 'Ready' }).waitFor()
  assert.deepEqual(errors, [], 'deployed gallery has browser or asset errors')
  console.log(
    `Deployment verified: ${manifest.components} sections, lazy frames, search, asset MIME types and revision ${revision}`,
  )
} finally {
  await browser.close()
}
