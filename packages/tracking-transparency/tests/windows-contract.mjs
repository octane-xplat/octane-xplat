import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
assert.equal(process.platform, 'win32', 'Run Windows checks through ssh windy')
const types = spawnSync(
	'powershell',
	[
		'-NoProfile',
		'-Command',
		'[void][Windows.System.UserProfile.AdvertisingManager,Windows.System.UserProfile,ContentType=WindowsRuntime]',
	],
	{ encoding: 'utf8' },
)
assert.equal(types.status, 0, 'WinRT AdvertisingManager type must resolve; no identifier is read')
const { backend, advertisingIdentifier } = await import('./windows-contract-bundle.mjs')
let reads = 0,
	fixture = 'SYNTHETICADVERTISINGID123'
const manager = {
	get AdvertisingId() {
		reads++
		return fixture
	},
}
globalThis.Windows = { System: { UserProfile: { AdvertisingManager: manager } } }
assert.deepEqual(backend.capabilities(), {
	prompt: false,
	advertisingId: true,
	advertisingIdAsync: true,
})
assert.equal(reads, 0, 'capability checks must not read an identifier')
assert.equal(backend.read(), -1)
assert.equal(await backend.request(), -1)
assert.equal(reads, 0, 'no-gate permission calls must not read an identifier')
assert.equal(advertisingIdentifier(backend.advertisingId(), backend.identifierFormat), fixture)
fixture = ''
assert.equal(await backend.advertisingIdAsync(), null)
fixture = '00000000000000000000000000000000'
assert.equal(
	advertisingIdentifier(await backend.advertisingIdAsync(), backend.identifierFormat),
	null,
)
delete globalThis.Windows
assert.equal(backend.capabilities().advertisingId, false)
assert.equal(backend.advertisingId(), null)
console.log(
	'Windows: 11 synthetic adapter assertions and WinRT type lookup pass. No host identifier was retrieved or logged; live NativeScript getter remains unverified.',
)
