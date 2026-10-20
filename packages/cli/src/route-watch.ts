import { existsSync, statSync, watch, type FSWatcher } from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { loadRoutingConfig } from './route-config.ts'

interface RouteWatcherOptions {
	cwd: string
	directory?: string
	out?: string
	generate(
		signal: AbortSignal,
		inputs: { directory?: string; out?: string },
	): Promise<number | false>
	onGenerated?(count: number | false): void
	onError(error: unknown): void
	debounceMs?: number
}

const within = (root: string, file: string) => {
	const path = relative(root, file)
	return path === '' || (!isAbsolute(path) && path !== '..' && !path.startsWith('..' + sep))
}

function existingParent(file: string): string {
	let parent = dirname(file)
	while (!existsSync(parent) || !statSync(parent).isDirectory()) {
		const next = dirname(parent)
		if (parent === next) {
			throw new Error('No existing parent for route watcher')
		}

		parent = next
	}
	return parent
}

/** Watch containing directories so atomic saves and removed/recreated trees
 * remain observable. One build runs at a time; later edits invalidate its output. */
export function createRouteWatcher(options: RouteWatcherOptions) {
	const cwd = resolve(options.cwd)
	const configPath = resolve(cwd, 'xplat.routes.json')
	const watchers = new Map<string, { watcher: FSWatcher; recursive: boolean }>()
	let directory: string | undefined
	let output: string | undefined
	let sources: string[] = []
	let timer: ReturnType<typeof setTimeout> | undefined
	let attempt: AbortController | undefined
	let running: Promise<void> | undefined
	let queued = false
	let closed = false
	let settleReady!: (count: number | false) => void
	let rejectReady!: (error: unknown) => void
	const ready = new Promise<number | false>((resolve, reject) => {
		settleReady = resolve
		rejectReady = reject
	})
	void ready.catch(() => {})
	const report = (error: unknown) => {
		if (!closed) {
			options.onError(error)
		}
	}
	const changed = (root: string, filename: string | null) => {
		if (closed) {
			return
		}
		const file = filename === null ? null : resolve(root, filename)
		if (file && output && file.startsWith(output + '.')) {
			return
		}
		const configuredSource =
			file &&
			sources.some(
				(source) => within(source, file) || within(file, source) || file.startsWith(source + '.'),
			)
		if (
			file &&
			file !== configPath &&
			!configuredSource &&
			(!directory || (!within(directory, file) && !within(file, directory)))
		) {
			return
		}
		schedule()
	}
	const refresh = () => {
		// Discover missing reference paths so creating the file repairs a failed
		// watch build. generateRoutes still performs strict existence validation.
		const config = loadRoutingConfig(cwd, { allowMissingSources: true })
		const route =
			options.directory ??
			config?.directory ??
			['app', 'src/app'].find((path) => existsSync(resolve(cwd, path))) ??
			(['app', 'src/app'].some((path) => resolve(cwd, path) === directory)
				? directory
				: undefined) ??
			(config ? 'src/app' : undefined)
		const nextDirectory = route ? resolve(cwd, route) : undefined
		const nextOutput = nextDirectory
			? resolve(cwd, options.out ?? config?.out ?? resolve(nextDirectory, '../routes.gen')).replace(
					/\.ts$/,
					'',
				)
			: undefined
		if (directory && !nextDirectory) {
			throw new Error(
				'route/watch-no-source: restore the routing configuration or stop watching before changing its source ownership',
			)
		}
		if (output && nextOutput && output !== nextOutput) {
			throw new Error(
				'route/watch-output-changed: keep the existing out path while watching; to move generated files, stop watching, regenerate, update client/type imports and remove obsolete generated entries',
			)
		}
		directory = nextDirectory
		output = nextOutput
		sources = [...(config?.manifests ?? []), config?.context, config?.transitions]
			.filter((reference): reference is NonNullable<typeof reference> => !!reference)
			.map((reference) => resolve(cwd, reference.module))
		const roots = new Map<string, boolean>([[cwd, false]])
		for (const source of sources) {
			roots.set(existingParent(source), false)
			if (existsSync(source) && statSync(source).isDirectory()) {
				roots.set(source, true)
			}
		}
		if (directory) {
			// Watch its parent as well: removing a watched directory invalidates
			// native inode watches on some hosts. Filter callbacks to the route tree.
			const parent = existingParent(directory)
			roots.set(parent, roots.get(parent) ?? false)
			if (existsSync(directory) && statSync(directory).isDirectory()) {
				roots.set(directory, true)
			}
		}
		for (const [root, entry] of watchers) {
			if (!roots.has(root) || roots.get(root) !== entry.recursive) {
				entry.watcher.close()
				watchers.delete(root)
			}
		}
		for (const [root, recursive] of roots) {
			// Reuse a shared directory handle instead of registering duplicates.
			if (watchers.has(root)) {
				continue
			}

			const watcher = watch(root, { recursive, encoding: 'utf8' }, (_event, name) =>
				changed(root, name),
			)

			watcher.on('error', (error) => {
				if (watchers.get(root)?.watcher !== watcher) {
					return
				}
				watchers.delete(root)
				watcher.close()
				report(error)
			})

			watchers.set(root, { watcher, recursive })
		}
	}
	const drain = async () => {
		while (queued && !closed) {
			queued = false
			attempt = new AbortController()
			try {
				refresh()
				const count = await options.generate(attempt.signal, {
					directory: directory ? relative(cwd, directory).split(sep).join('/') || '.' : undefined,
					out: output ? relative(cwd, output).split(sep).join('/') : undefined,
				})

				if (!closed && !attempt.signal.aborted) {
					settleReady(count)
					options.onGenerated?.(count)
				}
			} catch (error) {
				if (!attempt.signal.aborted) {
					report(error)
				}
			}
		}
	}
	function schedule() {
		attempt?.abort()
		queued = true
		clearTimeout(timer)
		timer = setTimeout(() => {
			timer = undefined
			if (!running && !closed) {
				running = drain().finally(() => {
					running = undefined
				})
			}
		}, options.debounceMs ?? 50)
	}
	// Install the config watch before reading configuration, so a broken config
	// can be repaired without restarting this process.
	const configWatcher = watch(cwd, (_event, name) => changed(cwd, name))
	configWatcher.on('error', (error) => {
		if (watchers.get(cwd)?.watcher !== configWatcher) {
			return
		}
		watchers.delete(cwd)
		configWatcher.close()
		report(error)
	})
	watchers.set(cwd, { watcher: configWatcher, recursive: false })
	schedule()
	return {
		ready,
		async close() {
			if (closed) {
				await running
				return
			}
			closed = true
			queued = false
			attempt?.abort()
			clearTimeout(timer)
			rejectReady(new DOMException('Route watching stopped', 'AbortError'))
			for (const { watcher } of watchers.values()) {
				watcher.close()
			}
			watchers.clear()
			await running
		},
	}
}
