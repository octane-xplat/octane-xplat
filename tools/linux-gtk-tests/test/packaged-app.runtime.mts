import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { packageLinux } from '../../../packages/cli/src/linux/package.ts'
import { runRendererFixture } from '../renderer-fixture-core.mjs'

test('the Linux CLI archive launches with its packaged GTK and ICU runtime', async () => {
  const root = mkdtempSync(resolve(import.meta.dirname, '../.consumer-'))
  try {
    const sourceRenderer = resolve(import.meta.dirname, '../../../packages/linux-gtk-renderer')
    const renderer = join(root, 'node_modules/@octane-xplat/linux-gtk')
    const payloads = join(renderer, 'platforms/linux/runtime')
    mkdirSync(join(renderer, 'platforms/linux'), { recursive: true })
    cpSync(join(sourceRenderer, 'package.json'), join(renderer, 'package.json'))
    for (const name of ['core', 'provider.mjs', 'mason.gtk.mjs']) {
      cpSync(join(sourceRenderer, 'platforms', name), join(renderer, 'platforms', name), {
        recursive: true,
      })
    }
    cpSync(join(sourceRenderer, 'dist'), join(renderer, 'dist'), { recursive: true })
    symlinkSync(join(sourceRenderer, 'node_modules'), join(renderer, 'node_modules'), 'dir')
    execFileSync('python3', [
      resolve(import.meta.dirname, '../../linux-runtime-release/stage-runtime-release.py'),
      '--output',
      payloads,
    ])
    const payload = join(payloads, 'x86_64')
    for (const name of ['installed-app.gtk.tsx', 'native-sdk-smoke.ts']) {
      cpSync(resolve(import.meta.dirname, '../fixtures', name), join(root, name))
    }
    execFileSync(
      'bun',
      [
        'x',
        '--no-install',
        'tsc',
        '--ignoreConfig',
        '--noEmit',
        '--strict',
        '--skipLibCheck',
        '--module',
        'esnext',
        '--moduleResolution',
        'bundler',
        '--jsx',
        'preserve',
        '--allowImportingTsExtensions',
        join(payload, 'typings/index.d.ts'),
        join(root, 'installed-app.gtk.tsx'),
      ],
      { cwd: root, stdio: 'inherit' },
    )

    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({
        name: 'gtk-runtime-consumer',
        version: '1.0.0',
        private: true,
        type: 'module',
        xplat: {
          targets: {
            linux: {
              runtime: 'gtk',
              package: {
                applicationId: 'org.octanexplat.RuntimeConsumer',
                productName: 'GTK Runtime Consumer',
                executableName: 'gtk-runtime-consumer',
              },
            },
          },
        },
      }),
    )
    writeFileSync(
      join(root, 'vite.gtk.config.ts'),
      `
      import { linuxGtk } from '@octane-xplat/build/linux-gtk/vite'
      export default ({ mode }) => linuxGtk(mode, { root: import.meta.dirname, entry: 'installed-app.gtk.tsx' })
    `,
    )
    const { archive } = await packageLinux(root)
    await runRendererFixture({
      engine: 'native',
      stem: 'packaged-app',
      title: 'GTK Runtime Consumer',
      marker: 'GTK_PACKAGED_APP',
      input: false,
      checks: 3,
      packageArchive: archive,
      packageLauncher: './gtk-runtime-consumer/gtk-runtime-consumer',
    })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
