import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'
import { localOutputFile } from './local-output.mjs'

const root = process.cwd()
const outputPath = localOutputFile(
  process.argv[2] ?? 'research/desktop-audit/windows-resolution.json',
  root,
)

const req = createRequire(resolve(root, 'tools/windows-host/package.json'))
const { createServer } = await import(req.resolve('vite'))

process.chdir(resolve(root, 'tools/windows-host'))
process.env.NATIVESCRIPT_BUNDLER_ENV = JSON.stringify({ platform: 'windows' })

const { native } = await import(pathToFileURL(resolve(root, 'packages/cli/src/vite.ts')))
const config = await native('production')
const windowsManifest = JSON.parse(readFileSync(resolve(root, 'tools/windows-host/package.json'), 'utf8'))
const server = await createServer({
  configFile: false,
  root: process.cwd(),
  resolve: { ...config.resolve, dedupe: Object.keys(windowsManifest.dependencies) },
  plugins: config.plugins
    .flat(Infinity)
    .filter((p) =>
      [
        'ns-package-platform-resolver',
        'nativescript-package-resolver',
        'xplat-native-relative-resolution',
        'xplat-native-extension-order',
      ].includes(p?.name),
    ),
  server: { middlewareMode: true, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  logLevel: 'silent',
})

try {
  const results = []

  for (const [s, i] of [
    ['@octane-xplat/ui', 'apps/mobile/windows/index.ts'],
    ['@octane-xplat/gif', 'apps/mobile/windows/index.ts'],
    ['./AnimatedImage.tsrx', 'packages/gif/src/index.ts'],
    ['@octane-xplat/maps', 'apps/mobile/windows/index.ts'],
    ['./MapView.tsrx', 'packages/maps/src/index.ts'],
    ['@octane-xplat/sentry', 'apps/mobile/windows/index.ts'],
    ['@octane-xplat/platform/environment', 'apps/mobile/windows/index.ts'],
    ['./index.shared', 'packages/ui/src/index.mobile.ts'],
  ]) {
    try {
      results.push({
        specifier: s,
        importer: i,
        resolved:
          (await server.pluginContainer.resolveId(s, resolve(root, i)))?.id?.replace(
            root + '/',
            '',
          ) ?? null,
      })
    } catch (e) {
      results.push({ specifier: s, importer: i, error: e.message })
    }
  }

  console.log(
    JSON.stringify(
      {
        conditions: server.config.resolve.conditions,
        extensions: server.config.resolve.extensions,
        results,
      },
      null,
      2,
    ),
  )

  writeFileSync(outputPath, JSON.stringify(results, null, 2) + '\n')
} finally {
  await server.close()
}
