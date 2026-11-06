// Actual applications in this owned worktree, after their canonical Turbo
// typecheck prerequisites pass. Go may reconcile generated route outputs, but
// source modules and existing baked data must stay untouched.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  readFileSync,
  existsSync,
  mkdirSync,
  symlinkSync,
  rmSync,
  lstatSync,
  realpathSync,
} from 'node:fs'

import { join, resolve } from 'node:path'
import { planRoutes } from '../../packages/cli/src/route-generator.ts'

const root = resolve(import.meta.dirname, '../..')
const binary = join(root, 'research/go-cli/xplat-go-darwin-arm64-cli')
const build = JSON.parse(readFileSync(binary + '.json'))
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
  assert.equal(sha(readFileSync(join(root, file))), hash, `Stale actual-app typecheck: ${file}`)
}

for (const [name, directory] of [
  ['web', 'apps/web'],
  ['macos', 'apps/macos'],
  ['lightbox', 'packages/lightbox'],
  ['shared-app-routes', 'packages/app'],
]) {
  test(
    `native typecheck workflow accepts the actual ${name} project`,
    { skip: process.platform !== 'darwin' || process.arch !== 'arm64' },
    async () => {
      const app = join(root, directory)
      const plan = await planRoutes(app, undefined, undefined, { bake: false })
      const contracts = [...plan.outputs.keys()].find((path) => path.endsWith('.contracts.ts'))
      const baked = contracts?.replace(/\.contracts\.ts$/, '.data.ts')
      const before = baked && existsSync(baked) ? readFileSync(baked) : null
      // This source-only library runs the repository's relative TS script
      // rather than declaring a CLI installation. Supply the explicit worker
      // prerequisite for this fixture, then remove only our newly created link.
      const workerLink = join(app, 'node_modules/@octane-xplat/cli')
      let installedWorker = false
      if (name === 'lightbox') {
        try {
          lstatSync(workerLink)
        } catch (error) {
          if (error.code !== 'ENOENT') {
            throw error
          }

          mkdirSync(join(app, 'node_modules/@octane-xplat'), { recursive: true })
          symlinkSync(join(root, 'packages/cli'), workerLink, 'dir')
          installedWorker = true
        }
      }
      const child = spawn(binary, ['typecheck'], { cwd: app })
      let stdout = '',
        stderr = ''
      child.stdout.on('data', (bytes) => (stdout += bytes))
      child.stderr.on('data', (bytes) => (stderr += bytes))
      const timer = setTimeout(() => child.kill('SIGTERM'), 120000)
      try {
        const result = await new Promise((resolve, reject) => {
          child.once('error', reject)
          child.once('close', (code, signal) => resolve({ code, signal }))
        })

        assert.deepEqual(result, { code: 0, signal: null }, stdout + stderr)
        assert.match(stdout, /Typecheck clean/)
        for (const [file, source] of plan.outputs) {
          assert.equal(readFileSync(file, 'utf8'), source, file)
        }

        if (before) {
          assert.deepEqual(readFileSync(baked), before)
        }

        console.info(`${name}: native typecheck and canonical non-baked routes passed`)
      } finally {
        clearTimeout(timer)
        if (installedWorker) {
          assert.equal(realpathSync(workerLink), realpathSync(join(root, 'packages/cli')))
          rmSync(workerLink)
        }
      }
    },
  )
}
