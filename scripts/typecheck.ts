// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Package typecheck runner — expands tsconfig.envs.json into a single program
// covering every declared environment's files (the shared expansion lives in
// packages/cli/src/tsconfig-envs.ts) and runs tsrx-tsc on it. All platform
// module suffixes resolve under one fixed precedence order, extensionless
// first; per-file @jsxImportSource pragmas pick the renderer.
// Run from a package directory via its "typecheck" script.
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { expandEnvPrograms, loadEnvManifest } from '../packages/cli/src/tsconfig-envs.ts'

const dir = process.cwd()
const manifest = loadEnvManifest(dir)

if (!manifest) {
	console.error(
		`scripts/typecheck.ts: no ${join(dir, 'tsconfig.envs.json')} — this runner only expands environment manifests`,
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
		shell: process.platform === 'win32',
		cwd: dir,
		stdio: 'inherit',
	})

	if (res.status !== 0) {
		process.exit(res.status ?? 1)
	}
}
