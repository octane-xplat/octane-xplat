// Model ownership only. No native button, auth browser or OS input is exercised.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
const source = ts.transpile(await readFile(new URL('../src/sign-in-button-action.macos.ts', import.meta.url), 'utf8'), {
	module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
})
function load(signIn) {
	const exports = {}
	vm.runInNewContext(source, { exports, Promise })
	let props = {}, presses = 0
	const results = []
	props = { onPress() { presses++ }, onResult(value) { results.push(value) } }
	const action = exports.createSignInButtonAction(() => props, signIn)
	return { action, results, get presses() { return presses }, get props() { return props }, set props(value) { props = value } }
}
const flush = async () => { await Promise.resolve(); await Promise.resolve() }
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }

test('mounted enabled buttons notify once, suppress pending repeats and use the latest result callback', async () => {
	const pending = deferred(); let calls = 0
	const h = load(() => { calls++; return pending.promise })
	h.action.press(); assert.equal(calls, 0)
	h.action.mount(); h.props.disabled = true; h.action.press(); assert.equal(calls, 0)
	h.props.disabled = false; h.action.press(); h.action.press()
	assert.equal(calls, 1); assert.equal(h.presses, 1)
	const latest = []; h.props = { disabled: true, onResult(result) { latest.push(result) } }
	pending.resolve({ status: 'cancelled' }); await flush()
	assert.equal(h.results.length, 0); assert.equal(latest[0].status, 'cancelled')
})

test('unmount and replacement retire old results without cancelling native work or clearing a new lease', async () => {
	const first = deferred(), second = deferred(); let calls = 0
	const h = load(() => (++calls === 1 ? first : second).promise)
	const unmount = h.action.mount(); h.action.press(); unmount()
	const nextUnmount = h.action.mount(); h.action.press(); unmount()
	first.resolve({ status: 'success', credential: { provider: 'apple' } }); await flush()
	assert.equal(h.results.length, 0)
	second.resolve({ status: 'cancelled' }); await flush()
	assert.equal(h.results.length, 1); assert.equal(h.results[0].status, 'cancelled')
	nextUnmount(); h.action.press(); assert.equal(calls, 2)
})

test('onPress return values do not gate sign-in, but observed disable/unmount and recursive presses do', async () => {
	let calls = 0
	const h = load(async () => { calls++; return { status: 'cancelled' } })
	h.action.mount(); h.props.onPress = () => false
	h.action.press(); await flush(); assert.equal(calls, 1)
	h.props.onPress = () => { h.action.press(); h.props.disabled = true }
	h.action.press(); await flush(); assert.equal(calls, 1)
	h.props.disabled = false
	const unmount = h.action.mount(); h.props.onPress = () => { unmount(); h.action.mount() }
	h.action.press(); await flush(); assert.equal(calls, 1)
	h.props.onPress = () => { h.action.press() }
	h.action.press(); await flush(); assert.equal(calls, 2)
})

test('provider throws/rejections become one generic owned error without leaking native messages', async () => {
	for (const signIn of [() => { throw Error('sensitive-native-detail') }, () => Promise.reject(Error('sensitive-native-detail'))]) {
		const h = load(signIn); h.action.mount(); h.action.press(); await flush()
		assert.equal(h.results.length, 1); assert.equal(h.results[0].status, 'error')
		assert.equal(h.results[0].message, 'Sign-in failed')
		h.action.press(); await flush(); assert.equal(h.results.length, 2)
	}
})

test('onPress exceptions release the pending claim and propagate as consumer errors', async () => {
	let calls = 0
	const h = load(async () => { calls++; return { status: 'cancelled' } }); h.action.mount()
	h.props.onPress = () => { throw Error('consumer hook failed') }
	assert.throws(() => h.action.press(), /consumer hook failed/)
	assert.equal(calls, 0); assert.equal(h.results.length, 0)
	h.props.onPress = undefined; h.action.press(); await flush(); assert.equal(calls, 1)
})

test('provider settlement after teardown is consumed and result callbacks may start a new attempt', async () => {
	const pending = deferred(); let calls = 0
	const h = load(() => (++calls === 1 ? pending.promise : Promise.resolve({ status: 'cancelled' })))
	const unmount = h.action.mount(); h.action.press(); unmount()
	pending.reject(Error('retired')); await flush(); assert.equal(h.results.length, 0)
	h.action.mount(); h.props.onResult = () => { if (calls === 2) {h.action.press()} }
	h.action.press(); await flush(); assert.equal(calls, 3)
})
