import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
	registerStylesheet,
	stylesheetScope,
	stylesheetPseudoClasses,
	refreshMediaQueries,
	setStyleEnvironment,
} from '../src/css/stylesheets.ts'
import { computeCascade } from '../src/css/cascade.ts'
import { sampleKeyframeAnimation } from '../src/css/animations.ts'
import { transformConverter } from '../src/css/transforms.ts'
import { resolveClipPath } from '../src/css/clip-path.ts'
import type { KeyframeAnimationInfo } from '../src/css/keyframes.ts'

let W = 200
let seq = 0
function node(type: string, opts: any = {}) {
	const n: any = {
		id: String(opts.id ?? ++seq),
		type,
		cssType: type,
		cssClasses: new Set(opts.classes ?? []),
		cssPseudoClasses: new Set(opts.pseudo ?? []),
		parent: opts.parent ?? null,
		children: [] as any[],
		props: { className: (opts.classes ?? []).join(' '), style: opts.style },
		computedStyle: {},
		computedCustomProps: new Map(),
	}
	n.getChildIndex = (c: any) => n.children.indexOf(c)
	n.getChildAt = (i: number) => n.children[i]
	n.getChildrenCount = () => n.children.length
	if (n.parent) {
		n.parent.children.push(n)
	}
	return n
}

// ---- computeCascade options -------------------------------------------------

test('borderLonghands=false collapses sides/corners into unified keys', () => {
	registerStylesheet('blf', '.blf { border-top-width: 2; border-radius: 4 }')
	const n = node('masonview', { classes: ['blf'] })
	const c = computeCascade(n, stylesheetScope())
	assert.equal(c.style.borderWidth, 2)
	assert.equal(c.style.borderRadius, 4)
	assert.equal(c.style.borderTopWidth, undefined)
	assert.equal(c.style.borderTopLeftRadius, undefined)
})

test('borderLonghands=true emits per-side/per-corner keys', () => {
	registerStylesheet('blt', '.blt { border-top-width: 2; border-top-left-radius: 4 }')
	const n = node('masonview', { classes: ['blt'] })
	const c = computeCascade(n, stylesheetScope(), { borderLonghands: true })
	assert.equal(c.style.borderTopWidth, 2)
	assert.equal(c.style.borderTopLeftRadius, 4)
	assert.equal(c.style.borderWidth, undefined)
})

// ---- Animations in the cascade ----------------------------------------------

test('animation declarations leave the style bag and surface on animations', () => {
	registerStylesheet(
		'anim1',
		`@keyframes slide { from { opacity: 0 } to { opacity: 1 } }
		 .a1 { animation: slide 1s ease-in; opacity: 0.5 }`,
	)
	const n = node('masonview', { classes: ['a1'] })
	const c = computeCascade(n, stylesheetScope())
	assert.equal(c.style.opacity, 0.5)
	assert.equal(c.style.animation, undefined)
	assert.equal(c.animations.length, 1)
	assert.equal(c.animations[0].name, 'slide')
	assert.equal(c.animations[0].duration, 1000)
	assert.equal(c.animations[0].keyframes?.length, 2)
})

test('animations collect per matched ruleset in cascade order', () => {
	registerStylesheet(
		'anim2',
		`@keyframes a { from { opacity: 0 } to { opacity: 1 } }
		 @keyframes b { from { opacity: 0 } to { opacity: 0.5 } }
		 .a2 { animation-name: a }
		 .a2 { animation-name: b }`,
	)
	const c = computeCascade(node('masonview', { classes: ['a2'] }), stylesheetScope())
	// Both rulesets match; each contributes its parsed info.
	assert.deepEqual(
		c.animations.map((a) => a.name),
		['a', 'b'],
	)
})

test('media-gated keyframes attach only when the query matches', () => {
	W = 400
	setStyleEnvironment(() => ({ width: W, height: 300, colorScheme: 'light' as const, reducedMotion: false }))
	registerStylesheet(
		'anim3',
		`@media (min-width: 300px) { @keyframes wide { from { opacity: 0 } to { opacity: 1 } } }
		 @media (min-width: 9999px) { @keyframes narrow { from { opacity: 0 } to { opacity: 1 } } }
		 .wide { animation-name: wide }
		 .nar { animation-name: narrow }`,
	)
	const wide = computeCascade(node('masonview', { classes: ['wide'] }), stylesheetScope()).animations[0]
	const narrow = computeCascade(node('masonview', { classes: ['nar'] }), stylesheetScope()).animations[0]
	assert.equal(wide.keyframes?.length, 2)
	assert.equal(narrow.keyframes, undefined)
})

// ---- Media refresh + pseudo census ------------------------------------------

test('refreshMediaQueries reports transitions then settles; register resets', () => {
	W = 200
	setStyleEnvironment(() => ({ width: W, height: 300, colorScheme: 'light' as const, reducedMotion: false }))
	registerStylesheet('mq1', '@media (min-width: 300px) { .mq { color: red } }')
	// First call after register seeds the cache — may report either way; the
	// contract is: a repeat call with no env change returns false.
	refreshMediaQueries()
	assert.equal(refreshMediaQueries(), false)
	W = 500
	setStyleEnvironment(() => ({ width: W, height: 300, colorScheme: 'light' as const, reducedMotion: false }))
	assert.equal(refreshMediaQueries(), true)
	assert.equal(refreshMediaQueries(), false)
	W = 200
	setStyleEnvironment(() => ({ width: W, height: 300, colorScheme: 'light' as const, reducedMotion: false }))
	registerStylesheet('mq2', '.z { color: blue }')
	// Re-registering resets: next call re-evaluates (min-width flipped back
	// to false anyway, but cache must not suppress a second check).
	refreshMediaQueries()
	assert.equal(refreshMediaQueries(), false)
})

test('stylesheetPseudoClasses walks compound, descendant and :not()', () => {
	registerStylesheet(
		'pc1',
		`button:hover { color: red }
		 .a:active .b { color: blue }
		 .c:not(:disabled) { color: green }`,
	)
	const set = stylesheetPseudoClasses()
	assert.ok(set.has('hover'))
	assert.ok(set.has('active'))
	assert.ok(set.has('not') || set.has('disabled'))
})

// ---- Sampler -----------------------------------------------------------------

const kf = (duration: number, decls: [string, any][], curve?: any) => ({
	duration,
	declarations: decls.map(([property, value]) => ({ property, value })),
	curve,
})
const info = (over: Partial<KeyframeAnimationInfo> = {}): KeyframeAnimationInfo => ({
	name: 't',
	duration: 100,
	delay: 0,
	iterations: 1,
	curve: { type: 'named', name: 'linear' },
	isForwards: false,
	isReverse: false,
	keyframes: [],
	...over,
})

test('sampler: two keyframes at 0/50/100%', () => {
	const a = info({ keyframes: [kf(0, [['opacity', 0]]), kf(1, [['opacity', 1]])] })
	assert.equal(sampleKeyframeAnimation(a, 0).values.opacity, 0)
	assert.equal(Math.round(sampleKeyframeAnimation(a, 50).values.opacity! * 100) / 100, 0.5)
	assert.ok(sampleKeyframeAnimation(a, 99).values.opacity! > 0.98)
	// Without forwards fill the end resets (NS _resetAnimationValues).
	assert.deepEqual(sampleKeyframeAnimation(a, 100).values, {})
})

test('sampler: first keyframe at 50% is instant, not a played segment', () => {
	// Keyframes at 50%/100%: NS applies the 50% values at iteration start
	// (animate(view,0) never plays segment 0), then animates the remaining
	// 0.5×D. At t=25ms progress should be half of the 0→0.5 gap, not t/0.5D.
	const a = info({ keyframes: [kf(0.5, [['opacity', 0.5]]), kf(1, [['opacity', 1]])] })
	assert.equal(sampleKeyframeAnimation(a, 0).values.opacity, 0.5)
	assert.ok(
		Math.abs(sampleKeyframeAnimation(a, 25).values.opacity! - 0.75) < 0.01,
		`expected ~0.75, got ${sampleKeyframeAnimation(a, 25).values.opacity}`,
	)
	assert.ok(sampleKeyframeAnimation(a, 49.9).values.opacity! > 0.99)
})

test('sampler: per-keyframe curve shifts onto the next segment', () => {
	// ease-in (starts ~0) declared on keyframe 0 must curve segment 1, so at
	// t=25ms progress is well below linear 0.25.
	const a = info({
		keyframes: [
			kf(0, [['opacity', 0]], { type: 'named', name: 'ease-in' }),
			kf(0.5, [['opacity', 0.5]]),
			kf(1, [['opacity', 1]]),
		],
	})
	const v = sampleKeyframeAnimation(a, 25).values.opacity!
	assert.ok(v < 0.25, `expected curved progress < 0.25, got ${v}`)
	// Uncurved second segment stays linear: at 75ms ≈ midpoint 0.75.
	const v2 = sampleKeyframeAnimation(a, 75).values.opacity!
	assert.ok(Math.abs(v2 - 0.75) < 0.05, `expected ~0.75, got ${v2}`)
})

test('sampler: reverse flips the keyframe order', () => {
	const a = info({ isReverse: true, keyframes: [kf(0, [['opacity', 0]]), kf(1, [['opacity', 1]])] })
	// Reversed: first segment targets opacity 1 with duration
	// info.duration - 100 = 0 → instant; value 1 applies immediately.
	assert.equal(sampleKeyframeAnimation(a, 0).values.opacity, 1)
})

test('sampler: delay withholds values', () => {
	const a = info({ delay: 50, keyframes: [kf(0, [['opacity', 0]]), kf(1, [['opacity', 1]])] })
	assert.deepEqual(sampleKeyframeAnimation(a, 25).values, {})
	assert.equal(sampleKeyframeAnimation(a, 50).values.opacity, 0)
})

test('sampler: iterations=2 loops the timeline', () => {
	const a = info({ iterations: 2, keyframes: [kf(0, [['opacity', 0]]), kf(1, [['opacity', 1]])] })
	assert.equal(Math.round(sampleKeyframeAnimation(a, 150).values.opacity! * 100) / 100, 0.5)
	assert.equal(sampleKeyframeAnimation(a, 201).done, true)
	assert.deepEqual(sampleKeyframeAnimation(a, 201).values, {})
})

test('sampler: forwards fill holds the end', () => {
	const a = info({ isForwards: true, keyframes: [kf(0, [['opacity', 0]]), kf(1, [['opacity', 1]])] })
	const s = sampleKeyframeAnimation(a, 200)
	assert.equal(s.done, true)
	assert.equal(s.values.opacity, 1)
})

test('sampler: property absent from earlier keyframe animates from base', () => {
	const a = info({
		keyframes: [kf(0, [['opacity', 0]]), kf(1, [['opacity', 1], ['scaleX', 2]])],
	})
	// scaleX only declared on the 100% keyframe — base supplies the start.
	const s = sampleKeyframeAnimation(a, 50, { base: { scaleX: 1 } })
	assert.equal(Math.round(s.values.scaleX! * 100) / 100, 1.5)
})

test('sampler: % translate resolves against box', () => {
	const a = info({
		keyframes: [kf(0, [['translateX', 0]]), kf(1, [['translateX', { value: 0.5, unit: '%' }]])],
	})
	const s = sampleKeyframeAnimation(a, 50, { box: { width: 200, height: 100 } })
	assert.ok(Math.abs((s.values.translateX as number) - 50) < 0.5, `got ${s.values.translateX}`)
	// Without a box the percent endpoint steps at halfway.
	const s2 = sampleKeyframeAnimation(a, 25)
	assert.equal(s2.values.translateX, 0)
})

// ---- transformConverter ------------------------------------------------------

test('transformConverter parses translate/scale/rotate/rotate3d', () => {
	const t = transformConverter('translate(10px, 20%) scale(2) rotate(45deg)')
	assert.equal(t.translate.x, 10)
	assert.deepEqual(t.translate.y, { value: 0.2, unit: '%' })
	assert.equal(t.scale.x, 2)
	assert.equal(t.scale.y, 2)
	assert.equal(t.rotate.z, 45)
	// NS parses rotate3d's vector+angle through the generic branch (axis
	// coords kept, angle dropped); duplicate rotates then compose through a
	// 2D matrix that keeps only z — reproducing upstream's lossy result.
	const r = transformConverter('rotate3d(0, 0, 1, 30deg) rotateX(1.5708rad) rotateY(90deg)')
	assert.equal(r.rotate.z, 1)
})

test('transformConverter merges duplicate translates per axis', () => {
	const t = transformConverter('translateX(10px) translateX(50%)')
	assert.equal(t.translate.x, 60)
	assert.equal(t.translate.y, 0)
})

// ---- resolveClipPath ----------------------------------------------------------

test('resolveClipPath resolves each function', () => {
	const none = resolveClipPath('none', 100, 50)
	assert.equal(none.type, 'none')

	const inset = resolveClipPath('inset(10px 20% round 4px)', 100, 50) as any
	assert.equal(inset.type, 'inset')
	assert.equal(inset.top, 10)
	assert.equal(inset.right, 20)
	assert.equal(inset.bottom, 10)
	assert.equal(inset.left, 20)

	const circle = resolveClipPath('circle(25px at 50% 50%)', 100, 50) as any
	assert.equal(circle.type, 'circle')
	assert.equal(circle.cx, 50)
	assert.equal(circle.cy, 25)

	const ellipse = resolveClipPath('ellipse(20px 10px at 0 0)', 100, 50) as any
	assert.equal(ellipse.rx, 20)
	assert.equal(ellipse.ry, 10)

	const poly = resolveClipPath('polygon(0 0, 100% 0, 50% 100%)', 100, 50) as any
	assert.deepEqual(poly.points, [
		[0, 0],
		[100, 0],
		[50, 50],
	])
})

// ---- Import-order smoke test --------------------------------------------------

test('css/index.ts first-eval order registers a sheet without TDZ errors', async () => {
	const mod = await import('../src/css/index.ts')
	assert.equal(typeof mod.registerStylesheet, 'function')
	mod.registerStylesheet('smoke', '.s { color: #123456 }')
	const c = mod.computeCascade(node('masonview', { classes: ['s'] }), mod.stylesheetScope())
	assert.equal(c.style.color, '#123456')
})

test('evalMediaQuery normalizes Level-4 range syntax', async () => {
	const { evalMediaQuery, setStyleEnvironment } = await import('../src/css/stylesheets.ts')
	setStyleEnvironment(() => ({ width: 500, height: 300, colorScheme: 'light' as const, reducedMotion: false }))
	assert.equal(evalMediaQuery('(width>=300px)'), true)
	assert.equal(evalMediaQuery('(min-width: 300px)'), true)
	assert.equal(evalMediaQuery('(width<=300px)'), false)
	assert.equal(evalMediaQuery('(max-width: 300px)'), false)
	assert.equal(evalMediaQuery('(width>=600px)'), false)
	assert.equal(evalMediaQuery('(min-width: 300px)'), true, 'colon form unchanged')
})
