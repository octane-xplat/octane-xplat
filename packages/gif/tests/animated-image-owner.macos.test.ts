import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAppKitAnimatedImageOwner, type AppKitAnimatedImageNative } from '../src/animated-image-owner.macos.ts'
import type { AnimatedImageProps } from '../src/props.ts'

function surface() {
	const calls: [string, string?][] = []
	const native: AppKitAnimatedImageNative = {
		setSource: (value) => { calls.push(['source', value]) },
		setFit: (value) => { calls.push(['fit', value]) },
		setAlt: (value) => { calls.push(['alt', value]) },
		dispose: () => { calls.push(['dispose']) },
	}
	return { calls, native }
}
test('current props apply once; unchanged renders preserve playback and source changes restart only the source', () => {
	let props: AnimatedImageProps = { src: 'first.gif' }
	const owner = createAppKitAnimatedImageOwner(() => props), view = surface()
	owner.attach(view.native); owner.sync(); owner.attach(view.native)
	assert.deepEqual(view.calls, [['fit', 'aspectFit'], ['alt', ''], ['source', 'first.gif']])
	props = { src: 'second.gif', alt: 'Second', stretch: 'aspectFill' }; owner.sync()
	assert.deepEqual(view.calls.slice(3), [['fit', 'aspectFill'], ['alt', 'Second'], ['source', 'second.gif']])
	props = { ...props, src: '' }; owner.sync()
	assert.deepEqual(view.calls.at(-1), ['source', ''])
})
test('replacement retires the old surface; disposal is idempotent and later attachment gets current props', () => {
	const owner = createAppKitAnimatedImageOwner(() => ({ src: 'test.gif' })), first = surface(), second = surface()
	owner.attach(first.native); owner.attach(second.native); owner.dispose(); owner.dispose(); owner.sync()
	assert.equal(first.calls.filter(([name]) => name === 'dispose').length, 1)
	assert.equal(second.calls.filter(([name]) => name === 'dispose').length, 1)
	const third = surface(); owner.attach(third.native)
	assert.deepEqual(third.calls.at(-1), ['source', 'test.gif'])
})
test('reentrant old disposal leaves the newest surface current', () => {
	const owner = createAppKitAnimatedImageOwner(() => ({ src: 'test.gif' })), first = surface(), second = surface(), third = surface()
	owner.attach(first.native)
	first.native.dispose = () => owner.attach(third.native)
	owner.attach(second.native)
	assert.deepEqual(second.calls, [['dispose']])
	assert.deepEqual(third.calls.at(-1), ['source', 'test.gif'])
})
test('reentrant props synchronization prevents an older fit call from restoring stale source or alt', () => {
	let props: AnimatedImageProps = { src: 'old.gif', alt: 'Old' }
	const owner = createAppKitAnimatedImageOwner(() => props), view = surface(), setFit = view.native.setFit
	view.native.setFit = (value) => {
		view.native.setFit = setFit; setFit(value); props = { src: 'new.gif', alt: 'New', stretch: 'none' }; owner.sync()
	}
	// Only the first fit causes reentry.
	owner.attach(view.native)
	assert.deepEqual(view.calls.filter(([name]) => name === 'source'), [['source', 'new.gif']])
	assert.deepEqual(view.calls.filter(([name]) => name === 'alt'), [['alt', 'New']])
})
test('failed setter invalidates its snapshot so the next synchronization can retry', () => {
	const owner = createAppKitAnimatedImageOwner(() => ({ src: 'test.gif' })), view = surface(), setSource = view.native.setSource
	view.native.setSource = () => { throw Error('simulated native failure') }
	assert.throws(() => owner.attach(view.native), /simulated/)
	view.native.setSource = setSource; owner.sync()
	assert.deepEqual(view.calls.at(-1), ['source', 'test.gif'])
})
test('same-props reentry during a setter still completes the remaining unapplied fields', () => {
	const owner = createAppKitAnimatedImageOwner(() => ({ src: 'test.gif', alt: 'Test' })), view = surface(), setFit = view.native.setFit
	view.native.setFit = (value) => { setFit(value); owner.sync() }
	owner.attach(view.native)
	assert.deepEqual(view.calls, [['fit', 'aspectFit'], ['alt', 'Test'], ['source', 'test.gif']])
})
