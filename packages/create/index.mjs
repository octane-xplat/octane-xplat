#!/usr/bin/env node
import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { composeTargets, defaultTargets } from './scaffold.mjs'

const positional = process.argv.slice(2).filter((arg) => !arg.startsWith('-'))
const noInstall = process.argv.includes('--no-install')
const dir = resolve(positional[0] ?? 'octane-xplat-app')

if (existsSync(dir) && readdirSync(dir).length > 0) {
	console.error(`✗ ${dir} exists and is not empty`)
	process.exit(1)
}

composeTargets(defaultTargets, dir)

console.log(`\n✓ scaffolded ${dir}`)

if (noInstall) {
	console.log('\nSkipped install (--no-install). To run manually:')
	console.log(`  cd ${dir}\n  pnpm install\n  pnpm dev`)
	process.exit(0)
}

const install = spawnSync('pnpm', ['install'], { cwd: dir, stdio: 'inherit' })
if (install.status !== 0) {
	console.log(`\nInstall didn't finish (pnpm missing?). To run manually:`)
	console.log(`  cd ${dir}\n  pnpm install\n  pnpm dev`)
	process.exit(install.status ?? 1)
}

console.log('\n✓ installed — starting dev server (Ctrl+C to stop)\n')
spawnSync('pnpm', ['dev'], { cwd: dir, stdio: 'inherit' })
