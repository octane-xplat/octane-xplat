// Package typecheck runner — expands tsconfig.envs.json into one program per
// declared environment (presets live in packages/cli/src/tsconfig-envs.mjs)
// and runs tsrx-tsc on each. This replaces per-platform tsconfig.<platform>.json
// files: the checked surface is declared once, and every environment proves
// the same API surface compiles under its runtime's resolution rules.
// Run from a package directory via its "typecheck" script.
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { expandEnvPrograms, loadEnvManifest } from '../packages/cli/src/tsconfig-envs.mjs'

const dir = process.cwd()
const manifest = loadEnvManifest(dir)

if (!manifest) {
	console.error(
		`scripts/typecheck.mjs: no ${join(dir, 'tsconfig.envs.json')} — this runner only expands environment manifests`,
	)

	process.exit(1)
}

let programs
try {
	programs = expandEnvPrograms(dir, manifest)
} catch (e) {
	console.error(String(e.message ?? e))
	process.exit(1)
}

for (const { env, configPath } of programs) {
	console.log(`typecheck[${env}]: tsrx-tsc --noEmit -p ${configPath}`)
	const res = spawnSync('pnpm', ['exec', 'tsrx-tsc', '--noEmit', '-p', configPath], {
		cwd: dir,
		stdio: 'inherit',
	})

	if (res.status !== 0) {
		process.exit(res.status ?? 1)
	}
}
