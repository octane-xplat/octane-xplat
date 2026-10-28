import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'typescript'

function code(name) {
	return ts.transpileModule(
		readFileSync(
			name === 'environment' && process.env.WINDOWS_ENVIRONMENT_SOURCE
				? resolve(process.env.WINDOWS_ENVIRONMENT_SOURCE)
				: new URL(`../src/${name}.ts`, import.meta.url),
			'utf8',
		),
		{
			compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
		},
	).outputText
}

const sources = {
	environment: code('environment'),
	connectivity: code('connectivity.windows'),
	'connectivity-state': code('connectivity-state.windows'),
	'native-connectivity': code('native-connectivity'),
}

function fixture() {
	const appEvents = new Map()
	const state = {
		type: 1,
		callback: null,
		starts: 0,
		stops: 0,
		failStart: false,
		failStop: false,
		available: true,
	}
	const Windows = {
		Networking: {
			Connectivity: {
				NetworkConnectivityLevel: {
					None: 0,
					LocalAccess: 1,
					ConstrainedInternetAccess: 2,
					InternetAccess: 3,
				},
				NetworkInformation: {
					GetInternetConnectionProfile() {
						if (!state.available) {
							throw new Error('projection unavailable')
						}
						return state.type === 0
							? null
							: {
									GetNetworkConnectivityLevel: () => 3,
									IsWlanConnectionProfile: state.type === 1,
									IsWwanConnectionProfile: state.type === 2,
									NetworkAdapter: { IanaInterfaceType: state.type === 3 ? 6 : 999 },
								}
					},
				},
			},
		},
	}
	const Application = {
		suspended: false,
		suspendEvent: 'suspend',
		resumeEvent: 'resume',
		exitEvent: 'exit',
		on(name, callback) {
			if (!appEvents.has(name)) {
				appEvents.set(name, new Set())
			}
			appEvents.get(name).add(callback)
		},
		off(name, callback) {
			appEvents.get(name)?.delete(callback)
		},
	}
	const Connectivity = {
		connectionType: { none: 0, wifi: 1, mobile: 2, ethernet: 3, bluetooth: 4, vpn: 5 },
		getConnectionType: () => state.type,
		startMonitoring(callback) {
			state.starts++
			state.callback = callback
			if (state.failStart) {
				throw new Error('monitor startup failed')
			}
		},
		stopMonitoring() {
			state.stops++
			state.callback = null
			if (state.failStop) {
				throw new Error('monitor teardown failed')
			}
		},
	}
	const modules = new Map()
	const load = (name) => {
		if (modules.has(name)) {
			return modules.get(name)
		}
		const exports = {}
		modules.set(name, exports)
		vm.runInNewContext(sources[name], {
			exports,
			require(id) {
				if (id === '@nativescript/core') {
					return { Application, Connectivity }
				}
				if (id === '@octane-xplat/platform/windows') {
					return { Windows }
				}
				if (id.startsWith('./') && id.slice(2) in sources) {
					return load(id.slice(2))
				}
				throw new Error(`Unexpected import: ${id}`)
			},
		})
		return exports
	}
	return {
		environment: load('environment').environment,
		appEvents,
		state,
		emitApp(name) {
			if (name === 'suspend') {
				Application.suspended = true
			}
			if (name === 'resume') {
				Application.suspended = false
			}
			for (const callback of appEvents.get(name) ?? []) {
				callback()
			}
		},
		emitNetwork(type) {
			state.type = type
			state.callback?.(type)
		},
		get appListeners() {
			return [...appEvents.values()].reduce((sum, callbacks) => sum + callbacks.size, 0)
		},
	}
}

test('Windows environment resolves its NativeScript runtime and declarations with actual package conditions', () => {
	const directory = fileURLToPath(new URL('..', import.meta.url))
	const resolveFor = (conditions) => {
		const result = spawnSync(
			process.execPath,
			[
				...conditions.map((value) => `--conditions=${value}`),
				'--input-type=module',
				'--eval',
				"process.stdout.write(import.meta.resolve('@octane-xplat/platform/environment'))",
			],
			{ cwd: directory, encoding: 'utf8' },
		)
		assert.equal(result.status, 0, result.stderr)
		return fileURLToPath(result.stdout)
	}
	assert.equal(resolveFor(['windows', 'native']), resolve(directory, 'src/environment.ts'))
	assert.equal(
		resolveFor(['windows', 'types']),
		resolve(directory, 'types/generated/environment.d.ts'),
	)
	assert.equal(resolveFor(['web']), resolve(directory, 'src/environment.web.ts'))
	assert.equal(resolveFor(['macos']), resolve(directory, 'src/environment.macos.ts'))
	assert.equal(resolveFor(['ios', 'native']), resolve(directory, 'src/environment.ts'))
})

test('native environment composes connectivity and suspend/resume/exit across independent subscribers', () => {
	const f = fixture()
	const first = []
	const second = []
	const a = f.environment.subscribe((value) =>
		first.push({ online: value.online, active: value.active }),
	)
	const b = f.environment.subscribe((value) =>
		second.push({ online: value.online, active: value.active }),
	)
	assert.equal(f.state.starts, 1)
	assert.equal(f.appListeners, 6)
	f.emitApp('suspend')
	f.emitNetwork(0)
	f.emitApp('resume')
	assert.deepEqual(first, [
		{ online: true, active: true },
		{ online: true, active: false },
		{ online: false, active: false },
		{ online: false, active: true },
	])
	assert.deepEqual(second, first)
	a()
	assert.equal(f.appListeners, 3)
	assert.equal(f.state.stops, 0)
	f.emitApp('exit')
	assert.equal(first.length, 4)
	assert.equal(second.at(-1).active, false)
	b()
	assert.equal(f.appListeners, 0)
	assert.equal(f.state.stops, 1)
})

test('native environment stops queued callbacks and makes repeated teardown harmless', () => {
	const f = fixture()
	const values = []
	const stop = f.environment.subscribe((value) => values.push(value))
	const app = [...f.appEvents.values()].flatMap((callbacks) => [...callbacks])
	const network = f.state.callback
	stop()
	stop()
	for (const callback of app) {
		callback()
	}
	network(0)
	assert.equal(values.length, 1)
	assert.equal(f.appListeners, 0)
	assert.equal(f.state.stops, 1)
})

test('native environment unwinds app and network ownership when initial publication or startup fails', () => {
	for (const initialFailure of [true, false]) {
		const f = fixture()
		f.state.failStart = !initialFailure
		assert.throws(
			() =>
				f.environment.subscribe(() => {
					if (initialFailure) {
						throw new Error('reader failed')
					}
				}),
			initialFailure ? /reader failed/ : /monitor startup failed/,
		)

		assert.equal(f.appListeners, 0)
		assert.equal(f.state.callback, null)
		f.state.failStart = false
		const values = []
		const stop = f.environment.subscribe((value) => values.push(value.online))
		f.emitNetwork(0)
		assert.deepEqual(values, [true, false])
		stop()
		assert.equal(f.appListeners, 0)
	}
})

test('native environment removes app listeners even when native network teardown throws', () => {
	const f = fixture()
	const values = []
	const stop = f.environment.subscribe((value) => values.push(value))
	const callbacks = [...f.appEvents.values()].flatMap((callbacks) => [...callbacks])
	f.state.failStop = true
	assert.throws(stop, /monitor teardown failed/)
	assert.equal(f.appListeners, 0)
	assert.doesNotThrow(stop)
	for (const callback of callbacks) {
		callback()
	}
	assert.equal(values.length, 1)
	assert.equal(f.state.stops, 1)
})

test('Windows environment permits unknown transports and treats unavailable projection as unknown connectivity', () => {
	const f = fixture()
	f.state.type = 99
	assert.equal(f.environment.getSnapshot().online, true)
	const values = []
	const stop = f.environment.subscribe((value) => values.push(value.online))
	f.emitNetwork(0)
	f.state.available = false
	f.state.callback(0)
	assert.deepEqual(values, [true, false, undefined])
	assert.equal(f.environment.getSnapshot().capabilities.connectivity, false)
	stop()
	const unavailable = fixture()
	unavailable.state.available = false
	const end = unavailable.environment.subscribe((value) => assert.equal(value.online, undefined))
	assert.equal(unavailable.state.starts, 0)
	end()
	assert.equal(unavailable.appListeners, 0)
})
