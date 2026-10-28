import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const code = ts.transpileModule(
	readFileSync(new URL('../src/connectivity-state.windows.ts', import.meta.url), 'utf8'),
	{ compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

function fixture(profile, overrides = {}) {
	const api = {
		NetworkConnectivityLevel: {
			None: 0,
			LocalAccess: 1,
			ConstrainedInternetAccess: 2,
			InternetAccess: 3,
		},
		NetworkInformation: { GetInternetConnectionProfile: () => profile },
		...overrides,
	}
	const exports = {}
	vm.runInNewContext(code, {
		exports,
		require(id) {
			assert.equal(id, '@octane-xplat/platform/windows')
			return { Windows: { Networking: { Connectivity: api } } }
		},
	})
	const read = () => ({ ...exports.readWindowsConnectivity() })
	read.raw = exports.readWindowsConnectivity
	return read
}

const connected = (level = 3, details = {}) => ({
	GetNetworkConnectivityLevel: () => level,
	...details,
})

test('Windows connectivity reports known offline profiles separately from unavailable projections', () => {
	for (const profile of [null, connected(0)]) {
		assert.deepEqual(fixture(profile)(), { supported: true, online: false, type: 'none' })
	}
	for (const read of [
		fixture(undefined),
		fixture(connected(3), { NetworkInformation: undefined }),
		fixture(connected(3), {
			NetworkInformation: {
				GetInternetConnectionProfile() {
					throw new Error('unavailable')
				},
			},
		}),
		fixture({
			GetNetworkConnectivityLevel() {
				throw new Error('unavailable')
			},
		}),
		fixture(connected(3), { NetworkConnectivityLevel: undefined }),
		...[undefined, null, '3', NaN, 4].map((level) =>
			fixture({ GetNetworkConnectivityLevel: () => level }),
		),
	]) {
		assert.deepEqual(read(), { supported: false, online: false, type: 'unknown' })
	}
})

test('Windows connectivity permits local, constrained and internet access without claiming HTTP reachability', () => {
	for (const level of [1, 2, 3]) {
		for (const details of [
			{},
			{ NetworkAdapter: null },
			{ NetworkAdapter: { IanaInterfaceType: 131 } },
		]) {
			assert.deepEqual(fixture(connected(level, details))(), {
				supported: true,
				online: true,
				type: 'unknown',
			})
		}
	}
})

test('Windows connectivity labels only recognized transports and preserves online state when metadata throws', () => {
	for (const [type, details] of [
		['wifi', { IsWlanConnectionProfile: true }],
		['mobile', { IsWwanConnectionProfile: true }],
		['ethernet', { NetworkAdapter: { IanaInterfaceType: 6 } }],
		['wifi', { NetworkAdapter: { IanaInterfaceType: 71 } }],
		[
			'unknown',
			{
				get IsWwanConnectionProfile() {
					throw new Error('unavailable')
				},
				get IsWlanConnectionProfile() {
					throw new Error('unavailable')
				},
				get NetworkAdapter() {
					throw new Error('unavailable')
				},
			},
		],
	]) {
		const profile = Object.defineProperties(connected(), Object.getOwnPropertyDescriptors(details))
		assert.deepEqual(fixture(profile)(), { supported: true, online: true, type })
	}
})

test('Windows connectivity re-reads each snapshot without exposing shared mutable fallback states', () => {
	let profile = null
	const read = fixture(null, {
		NetworkInformation: { GetInternetConnectionProfile: () => profile },
	})
	read.raw().online = true
	assert.deepEqual(read(), { supported: true, online: false, type: 'none' })
	profile = connected(3, { IsWlanConnectionProfile: true })
	assert.deepEqual(read(), { supported: true, online: true, type: 'wifi' })
	profile = undefined
	assert.deepEqual(read(), { supported: false, online: false, type: 'unknown' })
})
