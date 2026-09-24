#!/usr/bin/env node
import { existsSync, readdirSync, cpSync, renameSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const dir = resolve(process.argv[2] ?? 'octane-xplat-app')

if (existsSync(dir) && readdirSync(dir).length > 0) {
	console.error(`✗ ${dir} exists and is not empty`)
	process.exit(1)
}

const template = join(dirname(fileURLToPath(import.meta.url)), 'template')
cpSync(template, dir, { recursive: true })
// npm packs .gitignore as a renamed file or drops it — ship it undotted.
try {
	renameSync(join(dir, 'gitignore'), join(dir, '.gitignore'))
} catch {}
console.log(`\n✓ scaffolded ${dir}`)

const install = spawnSync('pnpm', ['install'], { cwd: dir, stdio: 'inherit' })
if (install.status !== 0) {
	console.log(`\nInstall didn't finish (pnpm missing?). To run manually:`)
	console.log(`  cd ${dir}\n  pnpm install\n  pnpm dev`)
	process.exit(install.status ?? 1)
}

console.log('\n✓ installed — starting dev server (Ctrl+C to stop)\n')
spawnSync('pnpm', ['dev'], { cwd: dir, stdio: 'inherit' })
