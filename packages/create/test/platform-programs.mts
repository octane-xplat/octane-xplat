import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawnSync } from 'node:child_process'
import { globSync, mkdtempSync, mkdirSync, readFileSync, symlinkSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { composeTargets } from '../dist/scaffold.js'
import {
  assertPlatformIsolation,
  expandEnvPrograms,
  loadEnvManifest,
} from '../../cli/src/tsconfig-envs.ts'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

test(
  'the actual starter shared screen and entrypoints check in web, iOS and Android programs',
  { timeout: 180000 },
  (t) => {
    const dir = mkdtempSync(join(repo, 'research/starter-platforms-'))

    t.after(() => rmSync(dir, { recursive: true, force: true }))
    composeTargets(['web', 'ios', 'android'], dir)

    const workspaces = new Map(
      globSync('packages/*/package.json', { cwd: repo }).map((file) => {
        const manifest = JSON.parse(readFileSync(join(repo, file), 'utf8'))

        return [manifest.name, join(repo, dirname(file))]
      }),
    )

    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))

    // Exercise the generated sources against declared workspace packages and the
    // same SDK identity as UI, without a network install masking the graph.
    for (const name of [
      'octane',
      '@nativescript/core',
      '@nativescript/types',
      'vite',
      'typescript',
      'vitest',
      '@nativescript/unit-test-runner',
      '@valor/nativescript-websockets',
      'octane-xplat',
      '@octane-xplat/jsx',
      '@octane-xplat/ui',
      '@octane-xplat/workshop',
      '@octane-xplat/platform',
      '@octane-xplat/nativescript-octane',
    ]) {
      assert.ok(
        manifest.dependencies[name] || manifest.devDependencies[name],
        `${name} must be declared by the starter`,
      )

      const source =
        workspaces.get(name) ??
        (name === 'typescript' || name === 'vitest'
          ? join(repo, 'node_modules', name)
          : name === 'vite'
            ? join(repo, 'packages/cli/node_modules', name)
            : ['@nativescript/unit-test-runner', '@valor/nativescript-websockets'].includes(name)
              ? join(repo, 'apps/mobile/node_modules', name)
              : join(repo, 'packages/ui/node_modules', name))

      const dest = join(dir, 'node_modules', name)

      mkdirSync(dirname(dest), { recursive: true })
      symlinkSync(source, dest, 'dir')
    }

    const programs = expandEnvPrograms(dir, loadEnvManifest(dir))

    assert.deepEqual(
      programs.map((p) => p.env),
      ['web', 'ios', 'android'],
    )

    for (const program of programs) {
      assert.ok(program.files.includes(join(dir, 'src/App.tsrx')))
      assert.ok(
        program.files.includes(
          join(dir, program.env === 'web' ? 'src/app.web.test.tsx' : 'src/app.spec.tsrx'),
        ),
      )

      assert.equal(program.files.includes(join(dir, 'src/test.ts')), program.env !== 'web')

      const args = [
        join(dir, 'node_modules/typescript/bin/tsc'),
        '--runExternalCode',
        '--noEmit',
        '-p',
        program.configPath,
      ]

      const listing = spawnSync(process.execPath, [...args, '--listFilesOnly'], {
        cwd: dir,
        encoding: 'utf8',
      })

      assert.equal(listing.status, 0, listing.stdout + listing.stderr)
      assertPlatformIsolation(program.env, listing.stdout.split(/\r?\n/))

      const check = spawnSync(process.execPath, args, { cwd: dir, encoding: 'utf8' })

      assert.equal(check.status, 0, `${program.env}: ${check.stdout}${check.stderr}`)
    }
  },
)
