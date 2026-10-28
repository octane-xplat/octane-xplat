import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { computeCascade, registerStylesheet, unregisterStylesheet, setStyleEnvironment, refreshMediaQueries, sampleKeyframeAnimation, resolveTranslate } from '@octane-xplat/css-engine'

function busyStyles() {
	const source = readFileSync(new URL('../../ui/src/theme/tokens.css', import.meta.url), 'utf8')
	const start = source.indexOf('/* AppKit busy animation rules. */'), end = source.indexOf('/* AppKit busy animation rules end. */', start)
	assert.ok(start >= 0 && end > start)
	return source.slice(start, end)
}
function animations(classes: string[]) {
	const node: any = { type: 'masonview', cssType: 'masonview', cssClasses: new Set(classes), cssPseudoClasses: new Set(), props: {}, children: [], parent: null }
	return computeCascade(node).animations.filter((info) => info.keyframes?.length)
}

test('AppKit busy CSS selects rotation and percent slide tracks without matching ordinary progress', () => {
	setStyleEnvironment(() => ({ width: 400, height: 300, colorScheme: 'light', reducedMotion: false }))
	registerStylesheet('appkit-busy-source', busyStyles())
	try {
		const ring = animations(['vx-spinner', 'vx-spinner--appkit']), bar = animations(['vx-progressbar-fill--appkit', 'vx-progressbar-fill--indeterminate'])
		assert.equal(ring.length, 1); assert.equal(bar.length, 1); assert.equal(animations(['vx-progressbar-fill--appkit']).length, 0)
		const first = sampleKeyframeAnimation(ring[0], 0, {}), later = sampleKeyframeAnimation(ring[0], 400, {})
		assert.notEqual(first.values.rotate, later.values.rotate)
		const left = sampleKeyframeAnimation(bar[0], 0, { box: { width: 40, height: 8 } }), right = sampleKeyframeAnimation(bar[0], 600, { box: { width: 40, height: 8 } })
		const x = (value: any) => typeof value === 'object' ? resolveTranslate(value, 40) : Number(value)
		assert.ok(x(right.values.translateX) > x(left.values.translateX)); assert.equal(right.done, false)
	} finally { unregisterStylesheet('appkit-busy-source') }
})

test('AppKit busy rules remove and restore tracks when the reduced-motion environment refreshes', () => {
	let reduced = false
	setStyleEnvironment(() => ({ width: 400, height: 300, colorScheme: 'light', reducedMotion: reduced }))
	registerStylesheet('appkit-busy-reduce', busyStyles()); registerStylesheet('appkit-busy-generic-later', '.vx-spinner { animation:vx-appkit-spinner-turn .7s linear infinite }'); refreshMediaQueries()
	try {
		assert.equal(animations(['vx-spinner', 'vx-spinner--appkit']).length, 2)
		reduced = true; refreshMediaQueries(); assert.equal(animations(['vx-spinner', 'vx-spinner--appkit']).length, 0)
		assert.equal(animations(['vx-progressbar-fill--appkit', 'vx-progressbar-fill--indeterminate']).length, 0)
		reduced = false; refreshMediaQueries(); assert.equal(animations(['vx-spinner', 'vx-spinner--appkit']).length, 2)
	} finally { unregisterStylesheet('appkit-busy-reduce'); unregisterStylesheet('appkit-busy-generic-later'); setStyleEnvironment(() => ({ width: 0, height: 0, colorScheme: 'light', reducedMotion: false })) }
})

test('AppKit playback advances a percent slide and subtree stop restores base and retires ticking', async () => {
	const { sourceWithoutImports, runSlice } = await import('./mock-globals.ts')
	const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url)), start = source.indexOf('const ANIMATION_FRAME_MS'), end = source.indexOf('let cssWarnedProps', start)
	let now = 0
	const timers: (() => void)[] = [], frames: any[] = []
	const api = runSlice(source.slice(start, end) + '\n;({ playKeyframeAnimations, stopSubtreeAnimations, playing: () => playingNodes.size })', {
		Date: { now: () => now }, setTimeout: (callback: () => void) => { timers.push(callback); return timers.length },
		sampleKeyframeAnimation, resolveTranslate, transformToParts: () => ({}),
		applyStyle: (node: any, base: any) => { node.appliedStyle = { ...base, ...node.animatedStyle }; frames.push({ ...node.appliedStyle }) },
	})
	setStyleEnvironment(() => ({ width: 400, height: 300, colorScheme: 'light', reducedMotion: false })); registerStylesheet('appkit-busy-playback', busyStyles())
	try {
		const node = { props: {}, computedStyle: { translateX: 0 }, view: { frame: { size: { width: 40, height: 8 } } }, children: [] }
		api.playKeyframeAnimations(node, animations(['vx-progressbar-fill--appkit', 'vx-progressbar-fill--indeterminate']))
		const first = frames.at(-1).translateX; now = 600; timers.shift()!(); assert.ok(frames.at(-1).translateX > first); assert.equal(api.playing(), 1)
		api.stopSubtreeAnimations(node); assert.equal(api.playing(), 0); assert.equal(frames.at(-1).translateX, 0)
		const queued = timers.shift(); queued?.(); assert.equal(timers.length, 0)
	} finally { unregisterStylesheet('appkit-busy-playback') }
})
