import { command } from '@alloc/cmd-ts'
import { existsSync, readdirSync, rmSync } from 'node:fs'
import * as p from '@clack/prompts'

const DIRS = ['dist', '.ns-vite-build', 'node_modules/.vite', 'node_modules/.cache/xplat']

export const clean = command({
	name: 'clean',
	description: 'Remove generated builds and caches; preserve authored macOS sources',
	args: {},
	handler: async () => {
		const cwd = process.cwd()
		const platformOutputs = existsSync(`${cwd}/platforms`)
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
