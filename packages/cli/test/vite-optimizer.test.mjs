import assert from 'node:assert/strict'
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { createServer, loadConfigFromFile, resolveConfig } from 'vite'
import { xplatBoundary, xplatTsrx } from '../dist/vite.js'

for (const plugin of [xplatTsrx, xplatBoundary]) {
  test(`${plugin.name} defaults optimizer extensions after platform ordering hooks`, async () => {
    const config = await resolveConfig(
      {
        configFile: false,
        plugins: [
          plugin('web'),
          {
            name: 'final-extension-order',
            configResolved(config) {
              config.environments.client.resolve.extensions = ['.web.ts', '.ts']
            },
          },
        ],
        environments: { ssr: { resolve: { extensions: ['.server.ts', '.ts'] } } },
      },
      'serve',
    )

    assert.deepEqual(config.optimizeDeps.rolldownOptions.resolve.extensions, ['.web.ts', '.ts'])
    assert.deepEqual(
      config.environments.ssr.optimizeDeps.rolldownOptions.resolve.extensions,
      config.environments.ssr.resolve.extensions,
    )
  })
}

for (const extensions of [[], ['.custom.ts', '.ts']]) {
  test(`preserves explicit optimizer extensions ${JSON.stringify(extensions)} and other options`, async () => {
    const config = await resolveConfig(
      {
        configFile: false,
        plugins: [xplatBoundary('web')],
        optimizeDeps: {
          exclude: ['untouched'],
          rolldownOptions: { resolve: { extensions, mainFields: ['module'] } },
        },
      },
      'serve',
    )

    assert.deepEqual(config.optimizeDeps.rolldownOptions.resolve.extensions, extensions)
    assert.deepEqual(config.optimizeDeps.exclude, ['untouched'])
    assert.deepEqual(config.optimizeDeps.rolldownOptions.resolve.mainFields, ['module'])
  })
}

test('environment-specific optimizer overrides stay independent', async () => {
  const config = await resolveConfig(
    {
      configFile: false,
      plugins: [xplatBoundary('web')],
      resolve: { extensions: ['.web.ts', '.ts'] },
      environments: {
        ssr: {
          resolve: { extensions: ['.server.ts', '.ts'] },
          optimizeDeps: { rolldownOptions: { resolve: { extensions: ['.custom.ts'] } } },
        },
      },
    },
    'serve',
  )

  assert.deepEqual(config.environments.client.optimizeDeps.rolldownOptions.resolve.extensions, [
    '.web.ts',
    '.ts',
  ])

  assert.deepEqual(config.environments.ssr.optimizeDeps.rolldownOptions.resolve.extensions, [
    '.custom.ts',
  ])
})

test(
  'generated web config optimizes platform siblings and serves the dependency and worker',
  { timeout: 30_000 },
  async () => {
    // Canonicalize /var on macOS so Vite's filesystem allow list matches real paths.
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-optimizer-')))
    let server

    try {
      const dep = join(root, 'node_modules/platform-dep')

      mkdirSync(dep, { recursive: true })
      writeFileSync(join(root, 'package.json'), '{"private":true,"type":"module"}')
      writeFileSync(
        join(dep, 'package.json'),
        JSON.stringify({
          name: 'platform-dep',
          type: 'module',
          exports: { web: './index.web.ts', default: './index.ts' },
        }),
      )

      writeFileSync(join(dep, 'index.web.ts'), 'export { platform, startWorker } from "./db"')
      writeFileSync(join(dep, 'index.ts'), 'import "missing-native-entry"')
      writeFileSync(
        join(dep, 'db.ts'),
        'import "@nativescript/core"; import "@nativescript-community/sqlite"',
      )

      writeFileSync(
        join(dep, 'db.web.ts'),
        `
      export const platform = 'web-platform-sentinel'
      export const startWorker = () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    `,
      )

      writeFileSync(join(dep, 'worker.ts'), 'self.postMessage("web-worker-sentinel")')
      writeFileSync(join(root, 'entry.ts'), 'export { platform, startWorker } from "platform-dep"')

      const template = fileURLToPath(
        new URL('../../create/template/vite.config.ts', import.meta.url),
      )

      symlinkSync(
        fileURLToPath(new URL('../../toolchain', import.meta.url)),
        join(root, 'node_modules/octane-xplat'),
        process.platform === 'win32' ? 'junction' : 'dir',
      )

      const configPath = join(root, 'vite.config.ts')

      writeFileSync(configPath, readFileSync(template))

      const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' }, configPath)

      assert.ok(loaded)
      server = await createServer({
        ...loaded.config,
        configFile: false,
        root,
        cacheDir: join(root, 'cache'),
        logLevel: 'silent',
        server: { host: '127.0.0.1', port: 0, watch: null, fs: { allow: [root] } },
        optimizeDeps: { include: ['platform-dep'], noDiscovery: true },
      })

      await server.listen()

      const origin = server.resolvedUrls.local[0]
      const entry = await fetch(new URL('entry.ts', origin))

      assert.equal(entry.status, 200)

      const path = /from\s*["']([^"']+)["']/.exec(await entry.text())?.[1]

      assert.ok(path?.includes('/cache/'), 'entry must use a prebundled dependency')

      const dependency = await fetch(new URL(path, origin))

      assert.equal(dependency.status, 200)

      const source = await dependency.text()

      assert.match(source, /web-platform-sentinel/)
      assert.doesNotMatch(source, /@nativescript/)

      const workerPath = /new Worker\(new URL\(\s*(?:\/\*[\s\S]*?\*\/\s*)?["']([^"']+)["']/.exec(
        source,
      )?.[1]

      assert.ok(workerPath, source)

      const worker = await fetch(new URL(workerPath, dependency.url))

      assert.equal(worker.status, 200)
      assert.match(await worker.text(), /web-worker-sentinel/)
    } finally {
      await server?.close()
      rmSync(root, { recursive: true, force: true })
    }
  },
)
