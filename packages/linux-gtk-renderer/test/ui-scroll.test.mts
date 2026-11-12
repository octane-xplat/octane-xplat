import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import test from 'node:test'
import { build } from 'vite'
import { linuxGtk } from '../../cli/src/linux-gtk/vite.ts'
import { gjsAvailable, masonTypelibPresent } from './gjs-availability.mts'

const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))

test('headless scrolling observes real GTK ranges, animation, content resize and OS wheel input', async (t) => {
  const outDir = join(fixture, 'dist-ui-scroll')

  if (!gjsAvailable()) {
    t.skip('gjs is not installed')
    return
  }

  if (!masonTypelibPresent()) {
    t.skip('XplatMason typelib required for runtime')
    return
  }

  await build({
    logLevel: 'error',
    ...(await linuxGtk('production', {
      root: fixture,
      entry: 'src/ui-scroll-main.ts',
      outDir,
    })),
  })

  const bundle = join(outDir, 'app.js')

  assert.doesNotMatch(readFileSync(bundle, 'utf8'), /document\.createElement|window\.document/)

  const nativeDir = fileURLToPath(new URL('../native/xplatmason/', import.meta.url))
  const osWheel =
    process.platform === 'linux' &&
    !!process.env.DISPLAY &&
    spawnSync('xdotool', ['version']).status === 0

  const env = {
    ...process.env,
    XPLAT_MASON_TYPELIB: nativeDir,
    GTK_TEST_WHEEL: osWheel ? '1' : '0',
  }

  if (process.platform === 'darwin') {
    env.DYLD_FALLBACK_LIBRARY_PATH = [
      join(execFileSync('brew', ['--prefix'], { encoding: 'utf8' }).trim(), 'lib'),
      env.DYLD_FALLBACK_LIBRARY_PATH,
    ]
      .filter(Boolean)
      .join(':')
  }

  const child = spawn('gjs', ['-m', bundle], { env, stdio: ['ignore', 'pipe', 'pipe'] })
  let stdout = '',
    stderr = '',
    inputError

  child.stderr.on('data', (chunk) => {
    stderr += chunk
  })

  const lines = createInterface({ input: child.stdout })

  lines.on('line', (line) => {
    stdout += line + '\n'
    if (line !== 'GTK_UI_SCROLL_READY') {
      return
    }

    try {
      const id = execFileSync(
        'xdotool',
        ['search', '--onlyvisible', '--name', '^Octane GTK scroll test$'],
        { env, encoding: 'utf8' },
      )
        .trim()
        .split('\n')[0]

      execFileSync('xdotool', ['mousemove', '--sync', '--window', id, '40', '40', 'click', '5'], {
        env,
        timeout: 5000,
      })
    } catch (error) {
      inputError = error
      child.kill()
    }
  })

  const deadline = setTimeout(() => child.kill(), 25000)

  t.after(() => {
    clearTimeout(deadline)
    lines.close()
    if (child.exitCode === null) {
      child.kill()
    }
  })

  const code = await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('close', resolve)
  })

  assert.equal(code, 0, `${stdout}\n${stderr}\n${inputError ?? ''}`)

  const line = stdout.split('\n').find((s) => s.startsWith('GTK_UI_SCROLL '))

  assert.ok(line, stdout)

  const result = JSON.parse(line.slice('GTK_UI_SCROLL '.length))

  assert.ok(result.checks >= 20, JSON.stringify(result))
  assert.equal(result.osWheel, osWheel)
  t.diagnostic(
    `${process.platform}; GTK ${result.gtk}; ${result.checks} assertions; XplatMason; actual OS wheel input: ${osWheel}; no images`,
  )
}, 120000)
