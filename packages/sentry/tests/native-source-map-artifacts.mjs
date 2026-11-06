import assert from 'node:assert/strict'
import { SourceMap } from 'node:module'
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { xplatNative } from '@octane-xplat/cli/vite'

// Build-side artifact check for the starter's native bundler path
// (`xplatNative` in vite.config.native.mts): a production iOS build must emit
// JavaScript source maps that accept Debug ID injection and resolve back to
// the app's TypeScript. No upload, no device, no native archive.
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const fixture = await mkdtemp(join(root, '.native-artifacts-'))
const output = join(fixture, 'ns-build')
const previousCwd = process.cwd()
const previousBundlerEnv = process.env.NATIVESCRIPT_BUNDLER_ENV
const previousDistDir = process.env.NS_VITE_DIST_DIR
const previousVendorExclude = process.env.NS_VENDOR_EXCLUDE
try {
  // Upstream @nativescript/vite resolves platform and output dir from these
  // environment variables at module evaluation — set them before xplatNative
  // pulls the nativescript config in.
  process.env.NATIVESCRIPT_BUNDLER_ENV = JSON.stringify({ ios: true })
  process.env.NS_VITE_DIST_DIR = output

  await writeFile(
    join(fixture, 'package.json'),
    JSON.stringify(
      {
        name: 'sentry-native-artifact-fixture',
        private: true,
        main: 'src/index.ts',
        dependencies: {
          '@octane-xplat/nativescript-mason-core': '1.0.0-beta.7',
          '@octane-xplat/sentry': '0.0.0',
          '@nativescript/core': '9.1.3',
          '@nativescript-community/sentry': '4.6.49',
          octane: '0.16.3',
        },
      },
      null,
      2,
    ),
  )
  await writeFile(
    join(fixture, 'nativescript.config.ts'),
    `export default ${JSON.stringify({
      id: 'org.octanexplat.sentry.artifactfixture',
      appPath: 'src',
      appResourcesPath: 'App_Resources',
      cli: { packageManager: 'bun' },
      bundler: 'vite',
    })}\n`,
  )
  await mkdir(join(fixture, 'node_modules/@octane-xplat'), { recursive: true })
  await symlink(root, join(fixture, 'node_modules/@octane-xplat/sentry'), 'dir')
  // Mirror the guide's copy step: the app owns the example modules under src/.
  await mkdir(join(fixture, 'src'), { recursive: true })
  for (const file of ['reporting.mobile.ts', 'reporting-filter.ts']) {
    await copyFile(join(root, 'examples', file), join(fixture, 'src', file))
  }
  await writeFile(
    join(fixture, 'src/index.ts'),
    `import { reportNativeDeliveryCheck, startNativeReporting } from './reporting.mobile'\n\n` +
      `// Keep the reporting module reachable from the app entry so the release\n` +
      `// bundle carries it (and its source map) exactly as an installed build does.\n` +
      `globalThis.startNativeReporting = startNativeReporting\n` +
      `globalThis.runNativeDeliveryCheck = () => reportNativeDeliveryCheck()\n`,
  )

  process.chdir(fixture)
  // The documented integration: the starter preset plus a release-map opt-in.
  const config = await xplatNative('production', {
    extra: { build: { sourcemap: 'hidden' }, logLevel: 'error' },
  })
  await build(config)

  const emitted = await readdir(output)
  for (const file of ['bundle.mjs', 'vendor.mjs', 'bundle.mjs.map', 'vendor.mjs.map']) {
    assert.ok(emitted.includes(file), `missing ${file} in ${emitted}`)
  }

  const injected = spawnSync('bun', ['run', 'sentry-cli', 'sourcemaps', 'inject', output], {
    cwd: root,
    encoding: 'utf8',
  })
  assert.equal(injected.status, 0, injected.stderr)

  const script = await readFile(join(output, 'bundle.mjs'), 'utf8')
  const map = JSON.parse(await readFile(join(output, 'bundle.mjs.map'), 'utf8'))
  // Hidden maps: the bundle carries no sourceMappingURL comment; inject added
  // the Debug ID to both sides and registered it for runtime stack lookup.
  assert.ok(!script.includes('sourceMappingURL'))
  assert.ok(map.debugId)
  assert.ok(script.includes(`debugId=${map.debugId}`))
  assert.ok(script.includes('_sentryDebugIds'))
  assert.ok(map.sources.some((source) => source.includes('reporting.mobile.ts')))
  assert.ok(map.sources.some((source) => source.includes('reporting-filter.ts')))
  // The preset keeps original source out of the installed bundle's maps
  // (sourcemapExcludeSources): positions resolve, inline context stays the
  // app's choice — upload the maps before stripping them from the app dir.
  assert.ok(!map.sourcesContent || map.sourcesContent.every((source) => source == null))

  const marker = script.indexOf('Xplat native reporting check')
  assert.ok(marker >= 0)
  const before = script.slice(0, marker).split('\n')
  const original = new SourceMap(map).findEntry(before.length - 1, before.at(-1).length)
  // Minified mappings anchor at statement starts; a literal between anchors
  // resolves to its enclosing anchor — Sentry reports the same original file
  // and an adjacent line.
  assert.ok(original.originalSource.endsWith('reporting.mobile.ts'))
  const authored = (await readFile(join(fixture, 'src/reporting.mobile.ts'), 'utf8')).split('\n')
  assert.ok(
    authored
      .slice(Math.max(0, original.originalLine - 1), original.originalLine + 2)
      .some((line) => line.includes('Xplat native reporting check')),
    `marker not near mapped line ${original.originalLine}`,
  )

  const vendorMap = JSON.parse(await readFile(join(output, 'vendor.mjs.map'), 'utf8'))
  const vendorScript = await readFile(join(output, 'vendor.mjs'), 'utf8')
  assert.ok(vendorMap.debugId)
  assert.ok(vendorScript.includes(`debugId=${vendorMap.debugId}`))

  const help = spawnSync('bun', ['run', 'sentry-cli', 'sourcemaps', 'upload', '--help'], {
    cwd: root,
    encoding: 'utf8',
  })
  assert.equal(help.status, 0, help.stderr)
  assert.ok(help.stdout.includes('--release') && help.stdout.includes('--dist'))
  console.log(
    `Built the xplatNative iOS production pipeline with hidden maps; Debug ID ${map.debugId} joins bundle.mjs to its map and the stack resolves to reporting.mobile.ts. Upload, archive dSYMs and Android mapping remain external credential/target steps.`,
  )
} finally {
  process.chdir(previousCwd)
  for (const [key, value] of [
    ['NATIVESCRIPT_BUNDLER_ENV', previousBundlerEnv],
    ['NS_VITE_DIST_DIR', previousDistDir],
    ['NS_VENDOR_EXCLUDE', previousVendorExclude],
  ]) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
  await rm(fixture, { recursive: true, force: true })
}
