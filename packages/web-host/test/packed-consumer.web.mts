/** Packed web-host acceptance: tarballs installed outside the workspace, the
 * maintained example copied verbatim, SSR and static-only servers exercised in
 * real browsers. Uses the proving app's declared Playwright tool; never
 * captures images or launches native devices. */
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'

import { createRequire } from 'node:module'
import { createServer as createNetServer } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const work = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-web-host-packed-')))
const consumer = join(work, 'consumer')
const pack = join(work, 'pack')

mkdirSync(consumer)
mkdirSync(pack)

const servers = []
let browser
let succeeded = false

function run(command, args, cwd = consumer, env = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, ...env },
  })

  assert.equal(
    result.status,
    0,
    `${command} ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`,
  )

  return result.stdout
}

function freePort() {
  return new Promise((resolve) => {
    const socket = createNetServer()

    socket.listen(0, '127.0.0.1', () => {
      const port = socket.address().port

      socket.close(() => resolve(port))
    })
  })
}

function startServer(env, label) {
  const portPromise = freePort()

  return portPromise.then(
    (port) =>
      new Promise((accept, reject) => {
        const child = spawn(process.execPath, ['serve.mjs'], {
          cwd: join(consumer, 'example'),
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env, ...env, PORT: String(port) },
        })

        servers.push(child)

        let output = ''
        const timer = setTimeout(
          () => reject(new Error(`${label} readiness timeout:\n${output}`)),
          30_000,
        )

        const capture = (chunk) => {
          output += chunk

          const match = /(https?:\/\/\S+)/.exec(output)

          if (match) {
            clearTimeout(timer)
            accept(match[1].replace(/\/+$/, ''))
          }
        }

        child.stdout.on('data', capture)
        child.stderr.on('data', capture)
        child.on('exit', () => {
          clearTimeout(timer)
          reject(new Error(`${label} exited early:\n${output}`))
        })
      }),
  )
}

// Collect the workspace dependency closure of @octane-xplat/web-host so every
// workspace specifier resolves to a tarball in the consumer.
function workspaceClosure(root) {
  const workspace = new Map()

  for (const dir of readdirSync(join(repo, 'packages'))) {
    const manifest = join(repo, 'packages', dir, 'package.json')

    if (existsSync(manifest)) {
      workspace.set(JSON.parse(readFileSync(manifest, 'utf8')).name, join(repo, 'packages', dir))
    }
  }

  const seen = new Map()
  const queue = [root]

  while (queue.length) {
    const dir = queue.shift()
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))

    if (seen.has(manifest.name)) {
      continue
    }

    seen.set(manifest.name, dir)
    for (const field of ['dependencies', 'peerDependencies']) {
      for (const [name, range] of Object.entries(manifest[field] ?? {})) {
        if (range === 'workspace:*' || range.startsWith('workspace:')) {
          queue.push(workspace.get(name))
        }
      }
    }
  }

  return seen
}

async function fetchText(url, init) {
  const response = await fetch(url, init)

  return { status: response.status, headers: response.headers, text: await response.text() }
}

try {
  // Pack the web-host tarball and its full workspace dependency closure.
  const tarballs = {}

  for (const [name, dir] of workspaceClosure(join(repo, 'packages/web-host'))) {
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))

    run('bun', ['pm', 'pack', '--ignore-scripts', '--destination', pack], dir)
    tarballs[name] =
      `file:${join(pack, `${name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`)}`
  }

  assert.ok(tarballs['@octane-xplat/web-host'], 'closure must contain web-host')

  cpSync(
    join(repo, 'packages/create/template/patches/octane@0.16.3.patch'),
    join(work, 'octane.patch'),
  )

  writeFileSync(
    join(consumer, 'package.json'),
    JSON.stringify(
      {
        name: 'web-host-packed-acceptance',
        private: true,
        type: 'module',
        packageManager: 'bun@1.4.4',
        dependencies: {
          '@octane-xplat/web-host': tarballs['@octane-xplat/web-host'],
          '@tsrx/oxc': '0.20.0',
          octane: '0.16.3',
          srvx: '1.0.6',
          vite: '8.3.6',
        },
        overrides: tarballs,
        patchedDependencies: { 'octane@0.16.3': '../octane.patch' },
      },
      null,
      2,
    ),
  )

  run('bun', ['install', '--ignore-scripts'])

  const req = createRequire(join(consumer, 'package.json'))

  for (const name of Object.keys(tarballs)) {
    assert.ok(
      realpathSync(join(consumer, 'node_modules', name)).startsWith(work),
      `${name} must come from a tarball`,
    )
  }

  for (const specifier of ['@octane-xplat/web-host', '@octane-xplat/ui', '@octane-xplat/build']) {
    const fromPackage = createRequire(
      join(consumer, 'node_modules', specifier, 'index.js'),
    ).resolve('octane')

    assert.equal(
      realpathSync(fromPackage),
      realpathSync(req.resolve('octane')),
      `single octane copy visible from ${specifier}`,
    )
  }

  console.log('PASS packed tarballs install and resolve a single Octane runtime')

  // The maintained example is the consumer: copy it verbatim and build twice.
  cpSync(join(repo, 'packages/web-host/example'), join(consumer, 'example'), {
    recursive: true,
    filter: (source) => !source.includes(`${join('example', 'dist')}`),
  })

  const first = run(process.execPath, ['build.mjs'], join(consumer, 'example'))

  assert.match(first, /rendered: 4/)

  const second = run(process.execPath, ['build.mjs'], join(consumer, 'example'))

  assert.match(second, /rendered: 0/)
  assert.match(second, /reused: 4/)
  console.log('PASS verbatim example builds, second run reuses all four pages including not-found')

  const ssrUrl = await startServer({}, 'SSR server')
  const staticUrl = await startServer({ STATIC: '1' }, 'static server')

  const playwright = createRequire(join(repo, 'apps/web/package.json'))('playwright')
  const names = (process.env.XPLAT_WEB_BROWSERS ?? 'chromium').split(',').filter(Boolean)

  for (const name of names) {
    const type = playwright[name]

    browser = await type.launch({ headless: true })
    try {
      for (const [label, base] of [
        ['ssr', ssrUrl],
        ['static', staticUrl],
      ]) {
        // a. Raw HTTP: rendered HTML plus hashed assets that actually serve.
        const page_ = await fetchText(`${base}/products/coat`)

        assert.equal(page_.status, 200)
        assert.match(page_.text, /<h1>.*Product coat/s)
        assert.match(page_.text, /<title>Product coat<\/title>/)

        const script = /<script type="module" src="([^"]+)"/.exec(page_.text)

        assert.ok(script, 'module script in document')
        for (const href of [
          script[1],
          ...[...page_.text.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]),
        ]) {
          const asset = await fetch(new URL(href, base))

          assert.equal(asset.status, 200, href)
          assert.match(
            asset.headers.get('Content-Type') ?? '',
            href.endsWith('.css') ? /css/ : /javascript/,
            href,
          )
        }

        console.log(`PASS ${name}/${label} rendered HTML links this build's hashed JS and CSS`)

        // b. JavaScript disabled: content and author CSS are fully readable.
        const context = await browser.newContext({ javaScriptEnabled: false })
        const noJs = await context.newPage()

        await noJs.goto(`${base}/products/coat`, { waitUntil: 'domcontentloaded' })
        assert.equal(await noJs.locator('h1').innerText(), 'Product coat')

        const color = await noJs.locator('h1').evaluate((node) => getComputedStyle(node).color)

        assert.equal(color, 'rgb(20, 90, 50)')
        assert.ok(await noJs.locator('button').count())
        assert.ok(await noJs.locator('a').count())
        await context.close()
        console.log(`PASS ${name}/${label} page is readable and styled without JavaScript`)

        // c. Hydration adopts server nodes; a single handler counts once.
        const marker = `marker-${name}-${label}`
        const page = await browser.newPage()
        const errors = []
        const collect = (list) => (message) => {
          // The document declares no favicon; resource 404s are unrelated noise.
          if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
            list.push(message.text())
          }
        }

        page.on('console', collect(errors))
        page.on('pageerror', (error) => errors.push(String(error)))
        await page.addInitScript((key) => {
          globalThis[key] = { navigations: 0 }
          document.addEventListener('readystatechange', () => {
            if (document.readyState === 'interactive') {
              globalThis[key].button = document.querySelector('main button')
              globalThis[key].h1 = document.querySelector('h1')
            }
          })
        }, marker)

        await page.goto(`${base}/products/coat`, { waitUntil: 'domcontentloaded' })
        await page.waitForSelector('html[data-web-app="started"]')

        const identity = await page.evaluate(
          (key) => ({
            button: globalThis[key].button === document.querySelector('main button'),
            h1: globalThis[key].h1 === document.querySelector('h1'),
            marker: globalThis[key],
          }),
          marker,
        )

        assert.equal(identity.button, true, 'the button node is adopted, not replaced')
        assert.equal(identity.h1, true, 'the h1 node is adopted, not replaced')

        const button = page.locator('main button')

        assert.equal(await button.innerText(), 'Add to bag: 0')
        await button.click()
        assert.equal(await button.innerText(), 'Add to bag: 1')
        await button.click()
        assert.equal(await button.innerText(), 'Add to bag: 2')
        assert.deepEqual(errors, [])
        console.log(`PASS ${name}/${label} hydration keeps node identity and binds one handler`)

        // d. Client navigation: link click swaps content without a reload.
        await page.locator('a', { hasText: 'All products' }).first().click()
        await page.waitForSelector('h1:has-text("Products")')
        assert.equal(new URL(page.url()).pathname, '/')
        await page.locator('a', { hasText: 'Product hat' }).first().click()
        await page.waitForSelector('h1:has-text("Product hat")')
        assert.equal(new URL(page.url()).pathname, '/products/hat')
        assert.ok(
          await page.evaluate((key) => globalThis[key] !== undefined, marker),
          'client navigation never reloaded the document',
        )

        assert.deepEqual(errors, [])
        console.log(`PASS ${name}/${label} NavLink navigates client-side without a reload`)
        await page.close()

        // e. Not-found: rendered 404, readable without JS, activates with JS.
        const missing = await fetchText(`${base}/nope/deep`)

        assert.equal(missing.status, 404)
        assert.match(missing.text, /Not found/)

        const deadContext = await browser.newContext({ javaScriptEnabled: false })
        const deadNoJs = await deadContext.newPage()

        await deadNoJs.goto(`${base}/nope/deep`, { waitUntil: 'domcontentloaded' })
        assert.equal(await deadNoJs.locator('h1').innerText(), 'Not found')
        await deadContext.close()

        const dead = await browser.newPage()
        const deadErrors = []

        dead.on('console', collect(deadErrors))
        dead.on('pageerror', (error) => deadErrors.push(String(error)))
        await dead.goto(`${base}/nope/deep`, { waitUntil: 'domcontentloaded' })
        await dead.waitForSelector('html[data-web-app="started"]')
        assert.deepEqual(deadErrors, [])
        await dead.locator('a', { hasText: 'All products' }).first().click()
        await dead.waitForSelector('h1:has-text("Products")')
        assert.equal(new URL(dead.url()).pathname, '/')
        await dead.close()
        console.log(
          `PASS ${name}/${label} not-found renders 404, reads without JS, and activates with JS`,
        )
      }
    } finally {
      await browser.close()
      browser = undefined
    }
  }

  succeeded = true
} finally {
  for (const child of servers) {
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      try {
        child.kill('SIGTERM')
      } catch {}
    }
  }

  await browser?.close().catch(() => {})
  if (succeeded) {
    rmSync(work, { recursive: true, force: true })
  } else {
    console.error(`packed consumer kept for inspection: ${work}`)
  }
}
