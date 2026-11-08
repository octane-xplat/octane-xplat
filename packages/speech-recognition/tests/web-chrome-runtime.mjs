// Opt-in local proof — NOT part of the default `test` task (PR CI must not
// launch browsers). Drives real Google Chrome with Playwright against the
// package's web entry, feeds synthesized speech as microphone input, and
// asserts a real Web Speech transcript.
//
// Audio routes (tried in order unless one is forced):
//   --wav   (default) Chrome's --use-file-for-fake-audio-capture with a
//          `say`-generated 16-bit PCM wav played as the fake mic.
//          FINDING (Chrome 156): the fake device feeds getUserMedia streams
//          (peak verified) but NOT the Web Speech recognizer's own capture
//          path, which takes the real default input — the session ends
//          'no-speech'. Keep the route: it still exercises availability,
//          permission, and session lifecycle against the real service.
//   --boom  `say -a BoomAudio` — this host's default input is the BoomAudio
//          loopback, so spoken output is captured as mic input. AUDIBLE on
//          the user's headphones. FINDING (this host): Chrome's capture of
//          BoomAudio is silent (gUM peak 0 while ffmpeg hears -2.1 dB),
//          pending a macOS microphone grant for com.google.Chrome.
// Flags: --headed (headless is tried first), --phrase "..." override.
//
//   bun run test:web-runtime            (or: node tests/web-chrome-runtime.mjs)
//
// Artifacts land under ~/agent-scratch/octane-xplat/speech-recognition/ and
// are disposable.
import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const headed = args.includes('--headed')
const forcedRoute = args.includes('--boom') ? 'boom' : args.includes('--wav') ? 'wav' : null
const phraseIndex = args.indexOf('--phrase')
const phrase =
  phraseIndex !== -1 ? args[phraseIndex + 1] : 'the quick brown fox jumps over the lazy dog'

const runDir = join(
  homedir(),
  'agent-scratch/octane-xplat/speech-recognition',
  new Date().toISOString().replaceAll(':', '-'),
)

mkdirSync(runDir, { recursive: true })

const logLines = []
const log = (line) => {
  console.log(line)
  logLines.push(line)
}

function makeWav() {
  const aiff = join(runDir, 'phrase.aiff')
  const wav = join(runDir, 'phrase.wav')

  execFileSync('say', ['-o', aiff, phrase])
  execFileSync('ffmpeg', [
    '-y',
    '-i',
    aiff,
    '-acodec',
    'pcm_s16le',
    '-ar',
    '16000',
    '-ac',
    '1',
    wav,
  ])

  return wav
}

async function startFixtureServer() {
  // The page imports the package's workspace web entry; the lib dep resolves
  // through source aliases so no install state leaks into the result.
  const fixture = join(runDir, 'fixture')

  mkdirSync(fixture, { recursive: true })
  writeFileSync(
    join(fixture, 'index.html'),
    '<!doctype html><html><body><script type="module" src="/main.ts"></script></body></html>',
  )

  writeFileSync(
    join(fixture, 'main.ts'),
    `import { speechRecognition } from '@octane-xplat/speech-recognition'\n` +
      `(globalThis as Record<string, unknown>).xplat = { speechRecognition }\n`,
  )

  const server = await createServer({
    configFile: false,
    root: fixture,
    logLevel: 'warn',
    resolve: {
      conditions: ['web', 'module', 'browser', 'development'],
      extensions: ['.web.ts', '.ts', '.mjs', '.js', '.json'],
      alias: {
        '@octane-xplat/speech-recognition': join(packageRoot, 'src/index.web.ts'),
        '@octane-xplat/lib/capability': resolve(packageRoot, '../lib/src/capability.ts'),
      },
    },
    server: { host: '127.0.0.1', port: 0 },
  })

  await server.listen()
  return server
}

async function runRoute(route, serverUrl) {
  const launchArgs = ['--use-fake-ui-for-media-stream']

  if (route === 'wav') {
    launchArgs.push('--use-fake-device-for-media-stream')
    launchArgs.push(`--use-file-for-fake-audio-capture=${makeWav()}`)
  }

  log(`route=${route} headed=${headed} args=${JSON.stringify(launchArgs)}`)

  const browser = await chromium.launch({ channel: 'chrome', headless: !headed, args: launchArgs })

  try {
    const context = await browser.newContext()
    const page = await context.newPage()

    page.setDefaultTimeout(30000)

    const consoleErrors = []

    page.on('pageerror', (error) => consoleErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })

    await context.grantPermissions(['microphone'], { origin: serverUrl })
    await page.goto(serverUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForFunction(() => globalThis.xplat?.speechRecognition, undefined, {
      timeout: 30000,
    })

    const availability = await page.evaluate(() =>
      globalThis.xplat.speechRecognition.getAvailability({ lang: 'en-US' }),
    )

    log(`availability=${JSON.stringify(availability)}`)

    // Open a continuous session and let the wav/boom phrase play through.
    // Events are projected to plain data — SpeechRecognitionError instances
    // do not survive evaluate serialization intact.
    await page.evaluate(() => {
      const project = (event) => {
        if (event.type === 'state') {
          return { type: 'state', state: event.state }
        }

        if (event.type === 'transcript') {
          return { type: 'transcript', transcript: event.transcript, isFinal: event.isFinal }
        }

        const { result } = event

        return {
          type: 'end',
          result: {
            transcript: result.transcript,
            reason: result.reason,
            error: result.error
              ? {
                  name: result.error.name,
                  code: result.error.code,
                  nativeCode: result.error.nativeCode,
                  message: result.error.message,
                }
              : null,
          },
        }
      }

      const session = globalThis.xplat.speechRecognition.start({
        lang: 'en-US',
        continuous: true,
        interimResults: true,
      })

      const events = []

      globalThis.probe = { session, events }
      session.subscribe((event) => events.push(project(event)))
    })

    await page.waitForFunction(
      () =>
        globalThis.probe.events.some(
          (event) => event.type === 'state' && event.state === 'listening',
        ),
      undefined,
      { timeout: 30000 },
    )

    log('session reached listening')

    if (route === 'boom') {
      const say = spawn('say', ['-a', 'BoomAudio', phrase])

      await new Promise((resolve, reject) => {
        say.on('close', resolve)
        say.on('error', reject)
      })

      log('boom phrase spoken')
    }

    // Wait for a committed (final) transcript or the playback window.
    let sawFinal = false

    try {
      await page.waitForFunction(
        () => globalThis.probe.events.some((e) => e.type === 'transcript' && e.isFinal),
        undefined,
        { timeout: 30000 },
      )

      sawFinal = true
    } catch {
      sawFinal = false
    }

    const outcome = await page.evaluate(() => {
      const { session, events } = globalThis.probe
      const stopping = session.stop()

      return stopping.then((result) => ({ result, events }))
    })

    log(`result=${JSON.stringify(outcome.result)}`)
    log(`events=${JSON.stringify(outcome.events)}`)

    // Release check: nothing may be emitted after end.
    const eventCount = outcome.events.length

    await page.waitForTimeout(750)

    const laterCount = await page.evaluate(() => globalThis.probe.events.length)

    assert.equal(laterCount, eventCount, 'no events after end')

    // A second session aborts cleanly — the service is reusable.
    const aborted = await page.evaluate(() => {
      const session = globalThis.xplat.speechRecognition.start({
        lang: 'en-US',
        continuous: true,
      })

      return new Promise((resolve) => {
        setTimeout(() => {
          session.abort()
          session.result.then((result) =>
            resolve({
              transcript: result.transcript,
              reason: result.reason,
              error: result.error
                ? { code: result.error.code, message: result.error.message }
                : null,
            }),
          )
        }, 500)
      })
    })

    log(`abort result=${JSON.stringify(aborted)}`)
    assert.equal(aborted.reason, 'aborted')

    return { availability, outcome, sawFinal, consoleErrors }
  } finally {
    await browser.close()
  }
}

const server = await startFixtureServer()
let exitError = null

try {
  const url = server.resolvedUrls.local[0]
  const routes = forcedRoute !== null ? [forcedRoute] : ['wav', 'boom']
  let lastFailure = null

  for (const route of routes) {
    try {
      const { outcome, sawFinal, consoleErrors } = await runRoute(route, url)
      const transcript = outcome.result.transcript.toLowerCase()
      const words = ['quick', 'brown', 'fox', 'lazy', 'dog'].filter((w) => transcript.includes(w))

      assert.ok(
        words.length >= 2,
        `expected at least 2 phrase words in transcript, got ${JSON.stringify(transcript)}`,
      )

      const interim = outcome.events.filter((e) => e.type === 'transcript' && !e.isFinal)

      assert.ok(interim.length > 0 || sawFinal, 'interim or final transcript events arrived')
      assert.ok(
        outcome.result.reason === 'stopped' || outcome.result.reason === 'completed',
        `session ended ${outcome.result.reason}`,
      )

      if (consoleErrors.length) {
        log(`page console errors: ${JSON.stringify(consoleErrors)}`)
      }

      log(`ROUTE ${route}: PASS transcript=${JSON.stringify(transcript)}`)
      lastFailure = null
      break
    } catch (error) {
      lastFailure = error
      log(`ROUTE ${route}: FAIL ${error?.message ?? error}`)
    }
  }

  if (lastFailure !== null) {
    exitError = lastFailure
  }
} finally {
  await server.close()
  writeFileSync(join(runDir, 'run.log'), `${logLines.join('\n')}\n`)
  log(`log written to ${join(runDir, 'run.log')}`)
}

if (exitError !== null) {
  throw exitError
}
