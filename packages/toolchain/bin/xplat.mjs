#!/usr/bin/env node
// The umbrella exposes xplat through @octane-xplat/cli's bin: a native
// executable in published installs, a .mjs launcher inside this repo.
import { createRequire } from 'node:module'
import { readFileSync, realpathSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Invoked through node_modules/.bin, import.meta.url is the alias path —
// resolve from this file's real location so the CLI can be found inside
// isolated-installer cells even when it is not a top-level package.
const require = createRequire(realpathSync(fileURLToPath(import.meta.url)))
const manifestPath = require.resolve('@octane-xplat/cli/package.json')
const cliRoot = dirname(manifestPath)
const binPath = resolve(cliRoot, JSON.parse(readFileSync(manifestPath, 'utf8')).bin.xplat)

function notInstalled(message) {
  console.error(`xplat: ${message}`)
  console.error(
    `The native executable was not installed. Repair it with:\n  node "${join(cliRoot, 'install-native.mjs')}"`,
  )
  process.exit(1)
}

if (statSync(binPath, { throwIfNoEntry: false })?.size === 0) {
  notInstalled('the bin is an empty placeholder')
}

const args = process.argv.slice(2)
const result = /\.[cm]?js$/.test(binPath)
  ? spawnSync(process.execPath, [binPath, ...args], { stdio: 'inherit' })
  : spawnSync(binPath, args, { stdio: 'inherit' })

if (result.signal) {
  process.kill(process.pid, result.signal)
} else if (result.error) {
  if (result.error.code === 'ENOEXEC' || result.error.code === 'EACCES') {
    notInstalled(result.error.message)
  }

  console.error(`xplat: ${result.error.message}`)
  process.exit(1)
} else {
  process.exit(result.status ?? 1)
}
