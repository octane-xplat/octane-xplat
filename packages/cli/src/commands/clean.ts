// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { command } from '@alloc/cmd-ts'
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import * as p from '@clack/prompts'

const DIRS = ['dist', '.ns-vite-build', 'node_modules/.vite', 'node_modules/.cache/xplat']

export const clean = command({
	name: 'clean',
	description: 'Remove generated builds and caches; preserve authored native sources',
	args: {},
	handler: async () => {
		const cwd = process.cwd()
		const manifest = existsSync(`${cwd}/package.json`)
			? JSON.parse(readFileSync(`${cwd}/package.json`, 'utf8'))
			: {}
		// NativeScript plugins ship authored Java/Swift, Gradle and pod files
		// here. Only an application's platform projects are generated output.
		const isPlugin = manifest.nativescript?.platforms != null
		const platformOutputs =
			!isPlugin && existsSync(`${cwd}/platforms`)
				? readdirSync(`${cwd}/platforms`)
						.filter((name) => name !== 'macos')
						.map((name) => `platforms/${name}`)
				: []

		const found = [...DIRS, ...platformOutputs].filter((d) => existsSync(`${cwd}/${d}`))
		if (found.length === 0) {
			p.log.info('Nothing to clean')
			return
		}

		if (process.stdout.isTTY) {
			const ok = await p.confirm({ message: `Remove ${found.join(', ')}?` })
			if (p.isCancel(ok) || !ok) {
				p.cancel('Cancelled')
				return
			}
		}

		for (const d of found) {
			rmSync(`${cwd}/${d}`, { recursive: true, force: true })
		}

		p.log.success(`Cleaned ${found.join(', ')}`)
	},
})
