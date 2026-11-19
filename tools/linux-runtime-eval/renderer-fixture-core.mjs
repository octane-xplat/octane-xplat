import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, resolve } from 'node:path'
import { build } from 'vite'
import { linuxGtk } from '../../packages/cli/src/linux-gtk/vite.ts'

const repoRoot = resolve(import.meta.dirname, '../..')
const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`

export async function runRendererFixture({
  stem,
  entry,
  title,
  marker,
  input = true,
  checks,
  engine,
  define,
  logPath = process.env.LINUX_RUNTIME_EVAL_LOG_PATH,
}) {
  if (!['native', 'gjs'].includes(engine)) {
    throw Error('Engine must be native or gjs')
  }

  const schemaInput =
    process.env.LINUX_RUNTIME_EVAL_GI_SCHEMA ?? 'research/linux-runtime-port/gi-x86_64-gtk414.json'
  const schemaPath = isAbsolute(schemaInput) ? schemaInput : resolve(repoRoot, schemaInput)
  const host = process.env.LINUX_RUNTIME_EVAL_HOST ?? 'andromeda.local'
  const vm = process.env.LINUX_RUNTIME_EVAL_VM ?? 'octane-linux'
  const executable = process.env.LINUX_RUNTIME_EVAL_EXECUTABLE
  const masonDir = process.env.LINUX_RUNTIME_EVAL_MASON_DIR

  if (engine === 'native' && !executable) {
    throw Error('Set LINUX_RUNTIME_EVAL_EXECUTABLE to the remote ns-linux binary')
  }
  if (!masonDir) {
    throw Error('Set LINUX_RUNTIME_EVAL_MASON_DIR to the remote Mason build directory')
  }
  if (engine === 'native' && !existsSync(schemaPath)) {
    throw Error(`GI schema not found: ${schemaPath}`)
  }

  const minChecks =
    typeof checks === 'number' ? checks : input ? checks?.os : checks?.properties
  if (!Number.isInteger(minChecks)) {
    throw Error(`Fixture ${stem} needs a numeric minimum check count`)
  }

  const fixtureRoot = resolve(repoRoot, 'packages/linux-gtk-renderer/test/fixtures')
  const entryFile = entry ?? `src/${stem}-main.ts`
  const projected = engine === 'native'
  const traceBounds = process.env.LINUX_RUNTIME_EVAL_TRACE_BOUNDS === '1'
  const traceApis = process.env.LINUX_RUNTIME_EVAL_TRACE_APIS === '1'
  const outDir = mkdtempSync(resolve(tmpdir(), `octane-linux-${stem}-`))

  const ssh = (script, options = {}) =>
    execFileSync(
      'ssh',
      [
        '-o',
        'BatchMode=yes',
        '-o',
        'ConnectTimeout=10',
        host,
        `PATH=/usr/local/bin:$PATH orb -m ${quote(vm)} -w /tmp sh -c ${quote(script)}`,
      ],
      options,
    )

  const saveLog = (contents) => {
    if (!logPath) return
    mkdirSync(dirname(logPath), { recursive: true })
    writeFileSync(logPath, contents)
  }

  async function buildFixture() {
    const preset = await linuxGtk('production', {
      root: fixtureRoot,
      entry: entryFile,
      outDir,
      nativeGiSchema: projected ? schemaPath : undefined,
    })
    const tracePlugin = {
      name: 'native-runtime-api-trace',
      enforce: 'pre',
      transform(code, id) {
        if (traceBounds && id.includes('popup-bounds')) {
          const expression = /const source\s*=\s*surfaceOrigin\(native\),\s*target\s*=\s*surfaceOrigin\(hostNative\)/
          if (!expression.test(code)) throw Error(`Could not install popup bounds trace in ${id}`)
          return code.replace(
            expression,
            "$&;console.log('[lre] popup surfaces',{source:!!source,target:!!target,same:source?.surface===target?.surface})",
          )
        }
        if (traceApis && id.includes('clipboard-write.gtk')) {
          const lookup = 'const clipboard = Gdk4.Display.get_default?.()?.get_clipboard?.()'
          if (!code.includes(lookup)) throw Error(`Could not install clipboard API trace in ${id}`)
          return code
            .replace(
              lookup,
              lookup +
                ";console.log('[lre] clipboard API',{clipboard:!!clipboard,setContent:typeof clipboard?.set_content,newForBytes:typeof Gdk4.ContentProvider?.new_for_bytes,bytes:typeof GLib.Bytes})",
            )
            .replace(
              '  } catch {\n    return false\n  }\n}',
              "  } catch (error) {\n    console.log('[lre] clipboard error',String(error))\n    return false\n  }\n}",
            )
        }
      },
    }

    await build({
      logLevel: 'error',
      ...preset,
      plugins: [...(traceBounds || traceApis ? [tracePlugin] : []), ...preset.plugins],
      define: { ...preset.define, ...define },
      build: { ...preset.build, minify: false },
    })

    if (!existsSync(resolve(outDir, 'app.js'))) {
      throw Error(`GTK fixture ${stem} build did not produce app.js`)
    }
    assert.doesNotMatch(readFileSync(resolve(outDir, 'app.js'), 'utf8'), /document\.createElement|window\.document/)
    writeFileSync(resolve(outDir, 'package.json'), '{"type":"module"}\n')
    writeFileSync(
      resolve(outDir, 'renderer-fixture-runner.py'),
      readFileSync(resolve(import.meta.dirname, 'renderer-fixture-runner.py')),
    )
  }

  async function runRemote() {
    const remote = ssh('mktemp -d /tmp/xplat-lre-XXXXXX', { encoding: 'utf8' }).trim()
    if (!/^\/tmp\/xplat-lre-[A-Za-z0-9]+$/.test(remote)) {
      throw Error(`Unexpected remote temporary directory: ${remote}`)
    }

    try {
      const archive = execFileSync('tar', ['-C', outDir, '-cf', '-', '.'], {
        maxBuffer: 64 * 1024 * 1024,
      })
      ssh(`tar -C ${quote(remote)} -xf -`, { input: archive })

      const runtime = engine === 'gjs' ? ['gjs', '-m'] : [executable]
      const environment = {
        LINUX_RUNTIME_EVAL_COMMAND: JSON.stringify(runtime),
        LINUX_RUNTIME_EVAL_ENGINE: engine,
        LINUX_RUNTIME_EVAL_TITLE: title,
        LINUX_RUNTIME_EVAL_MARKER: marker,
        LINUX_RUNTIME_EVAL_MIN_CHECKS: String(minChecks),
        LINUX_RUNTIME_EVAL_EXPECT_OS_INPUT: input ? '1' : '0',
        GTK_A11Y: 'test',
        XPLAT_MASON_TYPELIB: masonDir,
        LD_LIBRARY_PATH: masonDir,
      }
      if (projected) {
        environment.NS_V8_FLAGS = '--expose-gc'
        if (process.env.LINUX_RUNTIME_EVAL_ICU_DATA) {
          environment.ICU_DATA = process.env.LINUX_RUNTIME_EVAL_ICU_DATA
        }
      }
      const assignments = Object.entries(environment)
        .map(([name, value]) => `${name}=${quote(value)}`)
        .join(' ')
      const command = [
        'cd',
        quote(remote),
        '&& timeout 120s dbus-run-session -- xvfb-run -a env',
        assignments,
        'python3 renderer-fixture-runner.py app.js',
      ].join(' ')
      const output = ssh(command, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
      process.stdout.write(output)
      saveLog(output)
      const summary = output.trim().split('\n').at(-1)
      return JSON.parse(summary)
    } catch (error) {
      const stdout = error.stdout ?? error.output?.[1] ?? ''
      const stderr = error.stderr ?? error.output?.[2] ?? ''
      const outputText = (value) => (Buffer.isBuffer(value) ? value.toString('utf8') : String(value))
      const captured = `${outputText(stdout)}${outputText(stderr)}`
      saveLog(captured)
      process.stdout.write(captured)
      throw error
    } finally {
      ssh(`rm -rf ${quote(remote)}`)
    }
  }

  try {
    await buildFixture()
    return await runRemote()
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
}
