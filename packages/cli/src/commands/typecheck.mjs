import { command } from '@alloc/cmd-ts'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import { runTagged } from '../procs.mjs'
import { generateRoutes } from './routes.mjs'

export const typecheck = command({
	name: 'typecheck',
	description: 'tsrx-tsc --noEmit for every tsconfig present',
	args: {},
	handler: async () => {
		const cwd = process.cwd()
		const routeDir = ['app', 'src/app'].find((d) => existsSync(join(cwd, d)))
		if (routeDir) generateRoutes(cwd, routeDir)
		const configs = ['tsconfig.json', 'tsconfig.native.json'].filter((f) =>
			existsSync(`${cwd}/${f}`),
		)

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
