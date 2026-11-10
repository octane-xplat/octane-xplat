import { spawnSync } from 'node:child_process'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { prepare } from '../../probe/project.ts'

const [kind, device] = process.argv.slice(2)
const simulator = '91D40099-A056-497D-A572-ADDDFD6A8F23'

if (
  !['simulator', 'physical'].includes(kind) ||
  !device ||
  (kind === 'simulator' && device !== simulator)
) {
  throw new Error(`Usage: bench:animation:ios simulator ${simulator} | physical AUTHORIZED_UDID`)
}

// A fresh minimal NativeScript host avoids stale generated app projects and
// unrelated native plugins affecting the animation benchmark's build or runtime.
const fixture = fileURLToPath(
  new URL('../../../apps/mobile/src/benchmarks/animation-quality.ios.tsx', import.meta.url),
)

// Use Motion's declared native peer versions, not the broader mobile app's.
const dependencyAnchor = fileURLToPath(
  new URL('../../../packages/motion/package.json', import.meta.url),
)

const { root } = await prepare('ios', fixture, ['@octane-xplat/sheet'], undefined, dependencyAnchor)
const viteConfig = join(root, 'vite.host.config.mts')
// All source imports (including the app-owned entry) must share that one peer.
const inputDebug = process.env.XPLAT_ANIMATION_INPUT_DEBUG === '1'
const hostConfig = await readFile(viteConfig, 'utf8')

if (!hostConfig.includes('extra: {resolve: {alias:')) {
  throw new Error('Probe host resolve configuration changed; cannot ensure a single gesture peer')
}

await writeFile(
  viteConfig,
  hostConfig.replace(
    'extra: {resolve: {alias:',
    `extra: {define: {__XPLAT_ANIMATION_INPUT_DEBUG__: ${inputDebug}}, resolve: {dedupe: ['@nativescript-community/gesturehandler'], alias:`,
  ),
)

await mkdir(join(root, 'native-src'), { recursive: true })
await copyFile(
  fileURLToPath(
    new URL('../../../apps/mobile/benchmarks/AnimationQualityTrace.swift', import.meta.url),
  ),
  join(root, 'native-src/AnimationQualityTrace.swift'),
)

await writeFile(join(root, 'src/index.ts'), `import ${JSON.stringify(fixture)}\n`)
await writeFile(
  join(root, 'nativescript.config.ts'),
  `export default ${JSON.stringify({
    id: 'org.octanexplat.animationquality',
    appPath: 'src',
    appResourcesPath: 'App_Resources',
    cli: { packageManager: 'bun' },
    bundler: 'vite',
    bundlerConfigPath: 'vite.host.config.mts',
    ios: { NativeSource: [{ name: 'AnimationQualityTrace', path: 'native-src/**/*.swift' }] },
  })}\n`,
)

console.log(`Animation benchmark host: ${root}`)

// Build only. Installation and device execution require a separate reservation.
const result = spawnSync(
  'goddard-agent',
  [
    'resource',
    'run',
    '--json',
    JSON.stringify({
      resources: { native_builds: 1 },
      purpose: 'iOS animation benchmark release build',
    }),
    '--',
    'bun',
    'x',
    'ns',
    'build',
    'ios',
    '--release',
    '--device',
    device,
    ...(kind === 'physical' ? ['--for-device'] : ['--emulator']),
  ],
  {
    stdio: 'inherit',
    cwd: root,
    env: process.env,
  },
)

process.exit(result.status ?? 1)
