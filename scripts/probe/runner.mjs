import { randomUUID } from 'node:crypto'
import { existsSync, watchFile, unwatchFile } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { createServer as httpServer } from 'node:http'
import { dirname, join } from 'node:path'
import { doctor, selectDevice } from './doctor.mjs'
import { ownedProcess } from './process.mjs'
import { appFor, directory, importFrom, prepare, repo, scratchResolver } from './project.mjs'

import nativeCaseConfig from './native-case.config.mjs'
import { marker } from './runtime.mjs'

export function validateResult(result, options) {
	if (
		result?.schema !== 1 ||
		result.runId !== options.runId ||
		result.target !== options.target ||
		result.case !== options.case
	) {
		return false
	}

	return (
		['pass', 'fail'].includes(result.status) &&
		Array.isArray(result.assertions) &&
		Array.isArray(result.errors) &&
		typeof result.measurements === 'object' &&
		result.measurements !== null &&
		(result.status !== 'pass' ||
			(!result.errors.length && result.assertions.every((assertion) => assertion.pass === true)))
	)
}

async function caseConfig(project, target, options) {
	const relative = JSON.stringify(options.case.replace(/\.(tsrx|tsx|ts|mjs|js)$/, ''))
	const runtime = JSON.stringify(join(directory, 'runtime.mjs'))
	const native = ['ios', 'android'].includes(target)
	const contents = [
		`import * as probe from ${relative}`,
		`import { executeCase } from ${runtime}`,
		`import '@octane-xplat/ui/theme/tokens.css'`,
	]

	if (native) {
		contents.push(
			`import { mobileAdapter } from ${JSON.stringify(join(directory, 'mobile.mobile.mjs'))}`,
		)

		contents.push(
			'export async function start(options, emit) { return executeCase(probe, mobileAdapter(), options, emit) }',
		)
	} else if (target === 'macos') {
		contents.push(
			`export async function start(adapter) { return executeCase(probe, adapter, ${JSON.stringify(options)}) }`,
		)
	} else {
		contents.push(
			`import { browserAdapter } from ${JSON.stringify(join(directory, 'browser.web.ts'))}`,
		)

		contents.push(`const options = await (await fetch('/control')).json()`)
		contents.push(
			`if (options.runId) { await executeCase(probe, browserAdapter(${JSON.stringify(target)}), options, async (result) => fetch('/result', {method: 'POST', body: JSON.stringify(result)})) }`,
		)

		contents.push(
			`setInterval(async () => { const next = await (await fetch('/control')).json(); if (next.runId && next.runId !== options.runId) { location.reload() } }, 200)`,
		)
	}

	await writeFile(join(project.root, 'src/case.mjs'), contents.join('\n') + '\n')
	if (native) {
		return nativeCaseConfig(project.root, target)
	}

	if (target === 'macos') {
		const { createMacOSConfig } = await import(join(appFor(target), 'vite.shared.mjs'))
		const configFactory = createMacOSConfig({
			rules: [{ include: '**/*.{tsx,tsrx}', renderer: 'macos' }],
		})
		const config =
			typeof configFactory === 'function'
				? await configFactory({ command: 'build', mode: 'development' })
				: configFactory

		return {
			...config,
			root: project.root,
			plugins: [scratchResolver(project.root), ...config.plugins],
			build: {
				...config.build,
				outDir: 'dist',
				emptyOutDir: false,
				minify: false,
				lib: { entry: 'src/case.mjs', formats: ['cjs'], fileName: 'case' },
			},
		}
	}

	const { loadConfigFromFile } = await importFrom(project.root, 'vite')
	const base = (
		await loadConfigFromFile(
			{ command: 'serve', mode: 'development' },
			join(appFor(target), target === 'linux' ? 'vite.linux.config.ts' : 'vite.config.ts'),
		)
	).config

	await writeFile(
		join(project.root, 'index.html'),
		'<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div><script type="module" src="/src/case.mjs"></script></body></html>',
	)

	return {
		...base,
		configFile: false,
		root: project.root,
		plugins: [scratchResolver(project.root), ...base.plugins],
		server: { host: '127.0.0.1', port: 0, strictPort: true, fs: { allow: [repo] } },
	}
}

export async function runTarget(target, args, onResult, signal) {
	const availability = (await doctor()).targets[target]
	if (!availability.available) {
		throw Object.assign(new Error(availability.issues.join('; ')), { unavailable: true })
	}

	const native = ['ios', 'android'].includes(target)
	const device = native
		? selectDevice(target, availability, args.devices[target] ?? args.device)
		: undefined

	if (
		target === 'ios' &&
		availability.devices.find((entry) => entry.id === device)?.state !== 'Booted'
	) {
		throw Object.assign(
			new Error('Boot the explicitly selected simulator before running a probe'),
			{ unavailable: true },
		)
	}

	let project = await prepare(target, args.case, args.deps, args.resources)
	const { build, createServer } = await importFrom(project.root, 'vite')
	let host
	let server
	let browser
	let page
	let control = {}
	let bundle = ''
	let style = ''
	let resolveResult
	let rejectResult
	let timer
	let receiver
	let config
	let aborted = false
	let restart = false
	const watched = new Set()
	let pending = false
	let changed
	let resolveChange
	let url
	const accept = (result) => {
		if (!validateResult(result, control)) {
			return
		}

		resolveResult?.({ ...result, device: device ?? null, cache: project.root })
	}

	const endpoint = async (request, response, next) => {
		const pathname = new URL(request.url, 'http://localhost').pathname
		if (pathname === '/control') {
			response.setHeader('Content-Type', 'application/json')
			response.end(JSON.stringify(control))
		} else if (pathname === '/bundle') {
			response.end(bundle)
		} else if (pathname === '/style') {
			response.end(style)
		} else if (pathname === '/result' && request.method === 'POST') {
			let data = ''
			for await (const chunk of request) {
				data += chunk
				if (data.length > 1024 * 1024) {
					response.writeHead(413).end()
					return
				}
			}

			try {
				accept(JSON.parse(data))
				response.end('ok')
			} catch {
				response.writeHead(400).end('invalid result')
			}
		} else if (next) {
			next()
		} else {
			response.writeHead(404).end()
		}
	}

	const stopHost = async () => {
		receiver?.()
		receiver = undefined
		const closing = host
		host = undefined
		await closing?.stop()
	}

	const fail = (error) => {
		rejectResult?.(error)
	}

	const abort = () => {
		aborted = true
		fail(new Error('Probe interrupted'))
		resolveChange?.()
	}

	signal.addEventListener('abort', abort, { once: true })
	const watch = (paths) => {
		if (!args.watch) {
			return
		}

		for (const path of paths) {
			if (
				path.startsWith(join(repo, 'research/probes') + '/') ||
				!existsSync(path) ||
				watched.has(path)
			) {
				continue
			}

			watched.add(path)
			watchFile(path, { interval: 300 }, (current, previous) => {
				if (current.mtimeMs === previous.mtimeMs && current.size === previous.size) {
					return
				}

				clearTimeout(changed)
				changed = setTimeout(() => {
					pending = true
					resolveChange?.()
				}, 150)
			})
		}
	}

	const startHost = async () => {
		if (native) {
			host = ownedProcess(
				'python3',
				[
					join(repo, 'scripts/with-native-target-lock.py'),
					target,
					process.execPath,
					join(directory, 'mobile-launch.mjs'),
					target,
					device,
					project.root,
					project.appId,
					url,
					String(args.startupTimeout),
				],
				{ verbose: args.verbose },
			)
		} else if (target === 'linux') {
			host = ownedProcess('gjs', [join(appFor(target), 'host/gjs-host.js'), url], {
				env: { ...process.env, XPLAT_PROBE_APP_ID: project.appId },
				verbose: args.verbose,
			})
		} else if (target === 'macos') {
			const { createMacOSConfig } = await import(join(appFor(target), 'vite.shared.mjs'))
			const shellConfigFactory = createMacOSConfig({ packaged: true })
			const shellConfig =
				typeof shellConfigFactory === 'function'
					? await shellConfigFactory({ command: 'build', mode: 'development' })
					: shellConfigFactory

			await build({
				...shellConfig,
				configFile: false,
				root: project.root,
				logLevel: 'silent',
				server: { ...config.server, hmr: false },
				plugins: [scratchResolver(project.root), ...shellConfig.plugins],
				build: {
					...shellConfig.build,
					outDir: 'dist',
					emptyOutDir: false,
					minify: false,
					lib: {
						entry: join(directory, 'macos-shell.macos.mjs'),
						formats: ['cjs'],
						fileName: 'shell',
					},
				},
			})

			const { buildMacOSNative, writeNativeBootstrap } = await import(
				join(repo, 'packages/cli/src/macos/native.mjs')
			)

			const { macOSExecutable } = await import(join(repo, 'packages/cli/src/macos/executables.mjs'))
			const { hostBundle, validateHostBundle } = await import(
				join(repo, 'packages/cli/src/macos/jsc-host/runtime.mjs')
			)

			const artifact = await buildMacOSNative(project.root)
			const bootstrap = join(project.root, 'bootstrap.js')
			await writeNativeBootstrap(artifact, bootstrap)
			await validateHostBundle(join(project.root, 'dist/shell.cjs'), project.root)
			host = ownedProcess(
				await macOSExecutable(project.root, 'macos-arm64/host'),
				[
					join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
					join(project.root, 'dist/shell.cjs'),
					artifact.metadata,
					bootstrap,
				],
				{
					cwd: project.root,
					verbose: args.verbose,
					env: {
						...process.env,
						NODE_ENV: 'development',
						OCTANE_MACOS_EXTERNAL_RUNLOOP: '1',
						OCTANE_MACOS_AUTOMATION: '1',
						OCTANE_MACOS_DEV_BUNDLE: join(project.root, 'dist/case.cjs'),
					},
				},
			)

			receiver = host.onLine((line) => {
				const at = line.indexOf(marker)
				if (at < 0) {
					return
				}

				try {
					accept(JSON.parse(line.slice(at + marker.length)))
				} catch (error) {
					fail(error)
				}
			})
		}

		if (host) {
			const launched = host
			void launched.closed.then(() => {
				if (host === launched) {
					fail(launched.failure ?? new Error('Probe host closed'))
				}
			})
		}
	}

	try {
		const firstOptions = { runId: '', case: args.case, target, timeout: args.timeout }
		config = await caseConfig(project, target, firstOptions)
		if (native) {
			server = httpServer((request, response) => {
				void endpoint(request, response).catch((error) => {
					response.writeHead(500).end()
					fail(error)
				})
			})

			await new Promise((resolve, reject) => {
				server.once('error', reject)
				server.listen(0, '127.0.0.1', resolve)
			})

			url = 'http://127.0.0.1:' + server.address().port
		} else if (target !== 'macos') {
			server = await createServer({
				...config,
				logLevel: 'silent',
				server: { ...config.server, hmr: false },
				plugins: [
					{
						name: 'xplat-probe-results',
						configureServer(vite) {
							vite.middlewares.use((request, response, next) => {
								void endpoint(request, response, next).catch(fail)
							})
						},
					},
					...config.plugins,
				],
			})

			await server.listen()
			url = server.resolvedUrls.local[0]
			if (args.verbose) {
				process.stderr.write('[probe] server: ' + url + '\n')
			}

			if (target === 'web') {
				const { chromium } = await importFrom(appFor('web'), 'playwright')
				browser = await chromium.launch()
				page = await browser.newPage()
				page.on('pageerror', fail)
				page.on('response', async (response) => {
					if (response.status() >= 400) {
						if (args.verbose) {
							process.stderr.write((await response.text()).slice(0, 6000) + '\n')
						}

						fail(new Error(`Probe resource failed (${response.status()}): ${response.url()}`))
					}
				})

				if (args.verbose) {
					page.on('console', (message) =>
						process.stderr.write('[browser] ' + message.text() + '\n'),
					)
				}

				page.on('crash', () => fail(new Error('Chromium page crashed')))
			}
		}

		watch([
			args.case,
			join(repo, 'pnpm-lock.yaml'),
			...project.stamp.files,
			...project.stamp.files.map(dirname),
		])

		do {
			pending = false
			control = {}
			const options = { runId: randomUUID(), case: args.case, target, timeout: args.timeout }
			const resultPromise = new Promise((resolve, reject) => {
				resolveResult = resolve
				rejectResult = reject
			})

			resultPromise.catch(() => {})
			timer = setTimeout(
				() =>
					fail(
						new Error('Probe did not complete before the startup deadline. ' + (host?.tail ?? '')),
					),
				args.startupTimeout,
			)

			try {
				const next = await prepare(target, args.case, args.deps, args.resources)
				if (next.stamp.key !== project.stamp.key) {
					if (!native && target !== 'macos') {
						restart = true
						break
					}

					await stopHost()
					project = next
				}

				if (args.freshProcess) {
					await stopHost()
					if (browser) {
						await browser.close()
						const { chromium } = await importFrom(appFor('web'), 'playwright')
						browser = await chromium.launch()
						page = await browser.newPage()
						page.on('pageerror', fail)
					}
				}

				config = await caseConfig(project, target, options)
				if (native || target === 'macos') {
					const output = await build({ ...config, configFile: false, logLevel: 'silent' })
					const outputs = (Array.isArray(output) ? output : [output]).flatMap(
						(entry) => entry.output ?? [],
					)

					watch(
						outputs
							.filter((entry) => entry.type === 'chunk')
							.flatMap((entry) => Object.keys(entry.modules))
							.filter((path) => !path.includes('?')),
					)

					if (native) {
						bundle = await readFile(join(project.root, 'case-dist/case.cjs'), 'utf8')
						style = outputs
							.filter((entry) => entry.type === 'asset' && entry.fileName.endsWith('.css'))
							.map((entry) => String(entry.source))
							.join('\n')
					}
				}

				control = options
				if (target === 'web') {
					await page.goto(url)
					watch([...server.moduleGraph.idToModuleMap.keys()].filter((path) => !path.includes('?')))
				} else if (!host) {
					await startHost()
				} else if (target === 'macos') {
					host.child.stdin.write('reload\n')
				}

				const result = await resultPromise
				if (server?.moduleGraph) {
					watch([...server.moduleGraph.idToModuleMap.keys()].filter((path) => !path.includes('?')))
				}

				onResult(result)
				if (result.status !== 'pass') {
					await stopHost()
				}
			} catch (error) {
				onResult({
					schema: 1,
					...options,
					status: 'fail',
					host: target,
					device: device ?? null,
					assertions: [],
					measurements: {},
					errors: [{ message: error.message }],
					cache: project.root,
				})

				await stopHost()
			} finally {
				clearTimeout(timer)
				resolveResult = undefined
				rejectResult = undefined
			}

			if (!args.watch || aborted) {
				break
			}

			process.stderr.write(`[probe] ${target}: waiting for edits\n`)
			if (!pending) {
				await new Promise((resolve) => {
					resolveChange = resolve
				})
			}

			resolveChange = undefined
		} while (!aborted)
	} finally {
		control = {}
		clearTimeout(timer)
		clearTimeout(changed)
		for (const path of watched) {
			unwatchFile(path)
		}

		signal.removeEventListener('abort', abort)
		await stopHost()
		await browser?.close()
		if (server?.middlewares) {
			await server.close()
		} else if (server) {
			await new Promise((resolve) => server.close(resolve))
		}
	}

	return { restart: restart && !aborted }
}
