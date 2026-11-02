// @ts-nocheck — transitional command annotations retained from the reference.
import { command, flag, option, optional, string } from '@alloc/cmd-ts'
import * as p from '@clack/prompts'
import { createRouteWatcher } from '../route-watch.ts'
import { generateRoutes as generate } from '../route-generator.ts'
export const generateRoutes = (cwd, dir, out, opts = {}) => generate(cwd, dir, out, { onWarn: p.log.warn, ...opts })

export const routes = command({
	name: 'routes',
	description: 'Generate routes.gen.ts (typed RouteName/params) from the route dir',
	args: {
		watch: flag({
			long: 'watch',
			short: 'w',
			description: 'Regenerate when route sources or configuration change',
		}),
		dir: option({
			long: 'dir',
			short: 'd',
			type: optional(string),
			description: 'Route dir — xplat.routes.json, otherwise ./app or ./src/app',
		}),
		out: option({
			long: 'out',
			short: 'o',
			type: optional(string),
			description: 'Output file — default: <route dir>/../routes.gen.ts',
		}),
	},
	handler: async (args) => {
		const cwd = process.cwd()
		if (args.watch) {
			const watcher = createRouteWatcher({
				cwd,
				directory: args.dir,
				out: args.out,
				generate: (signal, inputs) => generateRoutes(cwd, inputs.directory, inputs.out, { signal }),
				onGenerated(count) {
					if (count !== false) {
						process.exitCode = 0
						p.log.success(`Generated route contracts and platform catalogs — ${count} routes`)
					}
				},
				onError(error) {
					process.exitCode = 1
					p.log.error(String(error.message ?? error))
				},
			})

			const interrupt = () => {
				process.exitCode = 130
				void watcher.close()
			}

			const terminate = () => {
				process.exitCode = 143
				void watcher.close()
			}

			process.once('SIGINT', interrupt)
			process.once('SIGTERM', terminate)
			let count
			try {
				count = await watcher.ready
			} catch (error) {
				if (error.name === 'AbortError') {
					return
				}

				throw error
			}

			if (count === false) {
				await watcher.close()
				process.off('SIGINT', interrupt)
				process.off('SIGTERM', terminate)
				p.log.error('No route dir found — configure xplat.routes.json or pass --dir.')
				process.exitCode = 1
			} else {
				p.log.info('Watching route sources and xplat.routes.json — Ctrl+C stops watching')
			}

			return
		}
		const count = await generateRoutes(cwd, args.dir, args.out)
		if (count === false) {
			p.log.error(
				'No route dir found — expected ./app, ./src/app, or xplat.routes.json (or pass --dir).',
			)

			process.exit(1)
		}

		p.log.success(
			`Generated route contracts and platform catalogs — ${count} route${count === 1 ? '' : 's'}`,
		)
	},
})
