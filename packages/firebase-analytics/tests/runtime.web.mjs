import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('..', import.meta.url))
// Exercise the real Firebase SDK at synthetic gtag and service-worker boundaries.
// This does not qualify provider ingestion, push delivery or OS notifications.
const server = await createServer({
  root,
  configFile: false,
  optimizeDeps: { include: ['firebase/app', 'firebase/analytics', 'firebase/messaging'] },
  resolve: { conditions: ['web'] },
  plugins: [
    {
      name: 'fixture',
      resolveId(id) {
        if (id === '/push.js') {
          return '\0push'
        }
        if (id === '/sdk.js') {
          return '\0sdk'
        }
      },
      load(id) {
        if (id === '\0push') {
          return "export { push } from '@octane-xplat/push'"
        }
        if (id === '\0sdk') {
          return "export { SDK_VERSION, getApps, deleteApp } from 'firebase/app'"
        }
      },
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.startsWith('/fixture')) {
            res.setHeader('Content-Type', 'text/html')
            res.end('<title>Firebase fixture</title>')
          } else if (req.url.startsWith('/messaging-sw.js')) {
            res.setHeader('Content-Type', 'text/javascript')
            res.end(
              "self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));self.addEventListener('message',event=>event.waitUntil(self.clients.matchAll({includeUncontrolled:true}).then(clients=>clients.forEach(client=>event.data.forEach(message=>client.postMessage(message))))));",
            )
          } else {
            next()
          }
        })
      },
    },
  ],
  server: { host: '127.0.0.1', port: 0 },
})

let browser
const config = {
  apiKey: 'synthetic-api-key',
  projectId: 'synthetic-fixture',
  appId: '1:123456:web:synthetic',
  messagingSenderId: '123456',
  measurementId: 'G-SYNTHETIC',
}

try {
  await server.listen()
  browser = await chromium.launch()
  const page = await browser.newPage()
  const requests = []
  await page.route('https://**/*', async (route) => {
    const url = route.request().url()
    requests.push(new URL(url).hostname)
    if (url.includes('firebase.googleapis.com')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(config),
      })
    }
    if (url.includes('firebaseinstallations.googleapis.com')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          fid: 'cSynthetictestfid1234567',
          refreshToken: 'synthetic-refresh',
          authToken: { token: 'synthetic-auth', expiresIn: '604800s' },
        }),
      })
    }
    if (url.includes('googletagmanager.com')) {
      return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' })
    }
    throw new Error('Unexpected external Firebase request: ' + new URL(url).hostname)
  })

  await page.goto(server.resolvedUrls.local[0] + 'fixture')
  await page.evaluate(() => {
    window.fixtureGtag = []
    window.gtag = (...args) => window.fixtureGtag.push(args)
  })

  const initial = await page.evaluate(async (config) => {
    const { firebaseAnalytics } = await import('/src/index.web.ts')
    const { push } = await import('/push.js')
    const { SDK_VERSION } = await import('/sdk.js')
    await firebaseAnalytics.init(config)
    await firebaseAnalytics.setUserId('synthetic-user')
    await firebaseAnalytics.setUserProperty('cohort', 'production')
    await firebaseAnalytics.logEvent('fixture_event', { phase: 'qualification' })
    await firebaseAnalytics.logLogin('synthetic')
    window.fixtureBarriers = 0
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.fixtureBarrier) {
        window.fixtureBarriers++
      }
    })
    window.fixtureMessages = []
    window.fixtureOpened = []
    const offMessage = push.onMessage((message) => window.fixtureMessages.push(message))
    const offOpen = push.onNotificationOpen((message) => window.fixtureOpened.push(message))
    await push.configure({ firebaseConfig: config, serviceWorkerUrl: '/messaging-sw.js' })
    const registration = await navigator.serviceWorker.ready
    const send = () => {
      registration.active.postMessage([
        {
          isFirebaseMessaging: true,
          messageType: 'push-received',
          fcmMessageId: 'synthetic-message',
          notification: { title: 'Synthetic title', body: 'Synthetic body' },
          data: { phase: 'fixture' },
        },
        {
          isFirebaseMessaging: true,
          messageType: 'notification-clicked',
          fcmMessageId: 'synthetic-open',
          notification: { title: 'Synthetic open' },
        },
        { fixtureBarrier: true },
      ])
    }
    window.fixtureSend = send
    window.fixtureOff = () => {
      offMessage()
      offOpen()
    }
    send()
    return {
      version: SDK_VERSION,
      analytics: firebaseAnalytics.supported,
      push: push.supported,
      configured: push.configured,
    }
  }, config)

  assert.equal(initial.analytics, true)
  assert.equal(initial.push, true)
  assert.equal(initial.configured, true)

  await page.waitForFunction(
    () =>
      window.fixtureGtag.some((args) => args[0] === 'event' && args[1] === 'fixture_event') &&
      window.fixtureMessages.length === 1 &&
      window.fixtureOpened.length === 1 &&
      window.fixtureBarriers === 1,
    null,
    { timeout: 15000 },
  )

  const observed = await page.evaluate(() => {
    window.fixtureOff()
    window.fixtureSend()
    return {
      events: window.fixtureGtag
        .filter((args) => args[0] === 'event')
        .map((args) => ({ name: args[1], phase: args[2]?.phase })),
      messages: window.fixtureMessages,
      opened: window.fixtureOpened,
    }
  })

  assert.ok(
    observed.events.some(
      (event) => event.name === 'fixture_event' && event.phase === 'qualification',
    ),
  )

  assert.ok(observed.events.some((event) => event.name === 'login'))
  assert.equal(observed.messages[0].messageId, 'synthetic-message')
  assert.equal(observed.messages[0].data.phase, 'fixture')
  assert.equal(observed.opened[0].messageId, 'synthetic-open')
  await page.waitForFunction(() => window.fixtureBarriers === 2)
  await page.evaluate(async () => {
    if (window.fixtureMessages.length !== 1 || window.fixtureOpened.length !== 1) {
      throw new Error('listener disposal failed')
    }
    for (const registration of await navigator.serviceWorker.getRegistrations()) {
      await registration.unregister()
    }
    const sdk = await import('/sdk.js')
    for (const app of sdk.getApps()) {
      await sdk.deleteApp(app)
    }
  })

  console.log(
    JSON.stringify({
      initial,
      events: observed.events,
      foregroundMessage: true,
      notificationOpen: true,
      disposal: true,
      syntheticTransport: true,
      requests,
    }),
  )
} finally {
  await browser?.close()
  await server.close()
}
