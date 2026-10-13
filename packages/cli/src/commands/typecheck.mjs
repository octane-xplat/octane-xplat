import { command } from '@alloc/cmd-ts'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import { runTagged } from '../procs.mjs'
import { generateRoutes } from './routes.mjs'
import { expandEnvPrograms, loadEnvManifest } from '../tsconfig-envs.mjs'

export const typecheck = command({
	name: 'typecheck',
	description: 'tsrx-tsc --noEmit for the app tsconfig plus the combined environment program',
	args: {},
	handler: async () => {
		const cwd = process.cwd()
		const routeDir = ['app', 'src/app'].find((d) => existsSync(join(cwd, d)))
		if (routeDir) {
			// bake: false — typecheck only needs the emitted types; an existing
			// routes.gen.data.ts is left as-is rather than re-executed.
			await generateRoutes(cwd, routeDir, undefined, { bake: false })
		}

		// tsconfig.json is the default program. The tsconfig.envs.json manifest
		// expands to one combined program spanning every declared environment;
		// a lone tsconfig.native.json is the legacy per-platform form kept
		// working for older scaffolds.
		const configs = ['tsconfig.json'].filter((f) => existsSync(join(cwd, f)))
		const manifest = loadEnvManifest(cwd)
		if (manifest) {
			let programs
			try {
				programs = expandEnvPrograms(cwd, manifest)
			} catch (e) {
				p.log.error(String(e.message ?? e))
				process.exit(1)
			}

			configs.push(...programs.map(({ configPath }) => configPath))
		} else {
			configs.push(...['tsconfig.native.json'].filter((f) => existsSync(join(cwd, f))))
		}

		for (const c of configs) {
			try {
				await runTagged('tsc', 'pnpm', ['exec', 'tsrx-tsc', '--noEmit', '-p', c], cwd)
			} catch (e) {
				p.log.error(String(e))
				process.exit(1)
			}
		}

		p.log.success('Typecheck clean')
	},
})
