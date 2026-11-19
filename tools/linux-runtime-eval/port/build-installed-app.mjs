import { build } from 'vite'
import {
  closeSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  renameSync,
  rmSync,
} from 'node:fs'
import { execFileSync } from 'node:child_process'
import { basename, dirname, join, resolve } from 'node:path'
import { linuxGtk } from '@octane-xplat/build/linux-gtk/vite'
import {
  stageGtkRuntime,
  writeGtkRuntimeLauncher,
} from '../../../packages/cli/src/linux/gtk-runtime.ts'

const [payload, outputArg] = process.argv.slice(2)
if (!payload || !outputArg || process.argv.length !== 4) {
  throw new Error('Pass the staged runtime payload and a new app output directory')
}
const output = resolve(outputArg)
const archive = output + '.tar.gz'
if (existsSync(archive)) throw new Error(`App archive already exists: ${archive}`)

const staging = mkdtempSync(join(dirname(output), '.gtk-runtime-'))
try {
  const runtime = join(staging, 'runtime')
  stageGtkRuntime(payload, runtime)
  mkdirSync(output)
  const preset = await linuxGtk('production', {
    root: resolve(import.meta.dirname, '..'),
    entry: 'port/installed-app.gtk.tsx',
    outDir: output,
    nativeGiSchema: join(runtime, 'gi.json'),
  })
  await build({
    ...preset,
    build: { ...preset.build, minify: false },
  })
  renameSync(runtime, join(output, 'runtime'))
  writeGtkRuntimeLauncher(output, 'launch', 'app.js')
  const archiveFd = openSync(archive, 'wx')
  try {
    execFileSync(
      'tar',
      ['--no-xattrs', '-czf', '-', '-C', dirname(output), '--', basename(output)],
      {
        stdio: ['ignore', archiveFd, 'inherit'],
        env: { ...process.env, COPYFILE_DISABLE: '1' },
      },
    )
  } finally {
    closeSync(archiveFd)
  }
} finally {
  rmSync(staging, { recursive: true })
}
