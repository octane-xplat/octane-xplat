import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { chromium, firefox, webkit } from 'playwright'
import { createServer } from 'vite'

const browserName = process.env.XPLAT_WEB_BROWSER ?? 'chromium'
const browserType = { chromium, firefox, webkit }[browserName]

if (!browserType) {
  throw new Error(`Unsupported XPLAT_WEB_BROWSER: ${browserName}`)
}

// Exercise the real SDK and facade; intercept only its network boundary.
const server = await createServer({
  root: fileURLToPath(new URL('..', import.meta.url)),
  configFile: false,
  plugins: [
    {
      name: 'sentry-test-page',
      resolveId(id) {
        if (id === '/fixture-sdk.js') {
          return '\0sentry-fixture-sdk'
        }
      },
      load(id) {
        if (id === '\0sentry-fixture-sdk') {
          return "export { flush, close } from '@sentry/browser'"
        }
      },
      configureServer(server) {
        server.middlewares.use('/fixture', (_request, response) => {
          response.setHeader('Content-Type', 'text/html')
          response.end('<title>Sentry transport fixture</title>')
        })
      },
    },
  ],
  server: { host: '127.0.0.1', port: 0 },
})

let browser

try {
  await server.listen()
  browser = await browserType.launch()

  const page = await browser.newPage()
  const events = []
  const errors = []

  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('https://sentry.invalid/**', async (route) => {
    const lines = route.request().postData().split('\n')

    for (let i = 1; i < lines.length - 1; i += 2) {
      if (JSON.parse(lines[i]).type === 'event') {
        events.push(JSON.parse(lines[i + 1]))
      }
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  await page.goto(server.resolvedUrls.local[0] + 'fixture')

  const state = await page.evaluate(async () => {
    const { sentry } = await import('/src/index.web.ts')
    const sdk = await import('/fixture-sdk.js')

    sentry.captureMessage('before init')
    sentry.init({
      dsn: 'https://synthetic@sentry.invalid/1',
      environment: 'qualification',
      release: 'fixture@1',
      dist: 'local',
      sampleRate: 1,
      enableAutoSessionTracking: false,
    })

    sentry.setUser({ id: 'synthetic-user' })
    sentry.setTag('cohort', 'production')
    sentry.setContext('fixture', { phase: 'capture' })
    sentry.addBreadcrumb({ message: 'fixture ready', category: 'qualification' })
    sentry.captureException(new Error('synthetic exception'), { operation: 'probe' })

    const exceptionFlushed = await sdk.flush(5000)

    sentry.setUser(null)
    sentry.setContext('fixture', null)
    sentry.captureMessage('after clear', 'warning')

    const messageFlushed = await sdk.flush(5000)
    const closed = await sdk.close(5000)

    sentry.captureMessage('after close')
    await sdk.flush(5000)
    return { supported: sentry.supported, exceptionFlushed, messageFlushed, closed }
  })

  assert.deepEqual(state, {
    supported: true,
    exceptionFlushed: true,
    messageFlushed: true,
    closed: true,
  })

  assert.equal(events.length, 2)

  const [exception, message] = events

  assert.equal(exception.exception.values[0].value, 'synthetic exception')
  assert.equal(exception.extra.operation, 'probe')
  assert.equal(exception.user.id, 'synthetic-user')
  assert.equal(exception.tags.cohort, 'production')
  assert.equal(exception.contexts.fixture.phase, 'capture')
  assert.ok(exception.breadcrumbs.some((crumb) => crumb.message === 'fixture ready'))
  assert.equal(exception.environment, 'qualification')
  assert.equal(exception.release, 'fixture@1')
  assert.equal(exception.dist, 'local')
  assert.equal(message.message, 'after clear')
  assert.equal(message.level, 'warning')
  assert.equal(message.user?.id, undefined)
  assert.equal(message.contexts.fixture, undefined)
  assert.deepEqual(errors, [])
  console.log(
    `${browserName}: real Sentry SDK exception/message envelopes, metadata, clear, flush and close pass; synthetic transport only.`,
  )
} finally {
  await browser?.close()
  await server.close()
}
