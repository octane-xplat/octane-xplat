import { test } from 'node:test'
import assert from 'node:assert/strict'
import { drawImageContent, setImageDrawingStyle } from '../src/image-drawing.ts'
import { mockGlobals, runSlice, sourceWithoutImports } from './mock-globals.ts'

function fixture() {
	const events: any[] = []
	const restore = mockGlobals({
		NSGraphicsContext: { saveGraphicsState: () => events.push('save'), restoreGraphicsState: () => events.push('restore') },
		NSBezierPath: { clipRect: (bounds: any) => events.push(['clip', bounds]) },
		NSCompositingOperation: { SourceOver: 2 },
	})
	const view: any = {
		imageScaling: 0, needsDisplay: false, flipped: false,
		bounds: { origin: { x: 10, y: 20 }, size: { width: 100, height: 100 } },
		image: { size: { width: 100, height: 200 }, drawInRectFromRectOperationFractionRespectFlippedHints: (...args: any[]) => events.push(['draw', ...args]) },
	}
	return { view, events, restore }
}

test('cover drawing clips to the box and converts top-based position for native flipped/unflipped contexts', () => {
	const env = fixture()
	try {
		assert.equal(drawImageContent(env.view), false)
		setImageDrawingStyle(env.view, 'objectFit', 'cover')
		setImageDrawingStyle(env.view, 'objectPosition', 'top left')
		assert.equal(env.view.needsDisplay, true)
		assert.equal(drawImageContent(env.view), true)
		assert.deepEqual(env.events[0], 'save')
		assert.deepEqual(env.events[1], ['clip', env.view.bounds])
		assert.deepEqual(env.events[2], ['draw', { origin: { x: 10, y: -80 }, size: { width: 100, height: 200 } },
			{ origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } }, 2, 1, true, null])
		assert.equal(env.events[3], 'restore')
		env.view.flipped = true
		drawImageContent(env.view)
		assert.deepEqual(env.events[6][1].origin, { x: 10, y: 20 })
		setImageDrawingStyle(env.view, 'objectFit', undefined)
		setImageDrawingStyle(env.view, 'objectPosition', undefined)
		assert.equal(env.view.imageScaling, 0)
		assert.equal(drawImageContent(env.view), false)
	} finally { env.restore() }
})

test('drawing restores graphics state after native failure and ignores pending or empty image geometry', () => {
	const env = fixture()
	try {
		setImageDrawingStyle(env.view, 'objectFit', 'contain')
		env.view.image.drawInRectFromRectOperationFractionRespectFlippedHints = () => { throw new Error('draw failed') }
		assert.throws(() => drawImageContent(env.view), /draw failed/)
		assert.equal(env.events.at(-1), 'restore')
		env.events.length = 0
		env.view.image = null
		assert.equal(drawImageContent(env.view), false)
		assert.deepEqual(env.events, [])
		env.view.image = { size: { width: 0, height: 0 } }
		assert.equal(drawImageContent(env.view), false)
		assert.deepEqual(env.events, [])
	} finally { env.restore() }
})

test('native image subclass retains hit testing and redraws after a real frame-size change', () => {
	const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
	const slice = source.slice(source.indexOf('class InputImageView'), source.indexOf('function makeImageView'))
	let fallback = 0, handled = false, metrics = 0, lifecycle = 0
	const transparent = new WeakSet()
	const { InputImageView } = runSlice(slice + '\n({ InputImageView })', {
		NSImageView: class {
			frame = { size: { width: 10, height: 20 } }
			needsDisplay = false
			drawRect() { fallback++ }
			viewDidMoveToWindow() { lifecycle++ }
			viewDidChangeBackingProperties() { lifecycle++ }
			setFrameSize(size: any) { this.frame.size = { ...size } }
			hitTest() { return this }
		},
		notifyImageGeometry() { metrics++ }, NativeClass() {}, inputTransparentViews: transparent, drawImageContent: () => handled,
	})
	const view = new InputImageView()
	assert.equal(view.wantsUpdateLayer, false)
	view.drawRect({})
	assert.equal(fallback, 1)
	handled = true
	view.drawRect({})
	assert.equal(fallback, 1)
	view.setFrameSize({ width: 10, height: 20 })
	assert.equal(view.needsDisplay, false)
	view.setFrameSize({ width: 20, height: 10 })
	assert.equal(view.needsDisplay, true)
	assert.equal(metrics, 1)
	view.viewDidMoveToWindow()
	view.viewDidChangeBackingProperties()
	assert.equal(metrics, 3)
	assert.equal(lifecycle, 2)
	assert.equal(view.hitTest({}), view)
	transparent.add(view)
	assert.equal(view.hitTest({}), null)
})

test('unsupported CSS positions center with one warning; invalid fit values never become native enum objects', () => {
	const env = fixture()
	const warnings: unknown[] = []
	const warn = console.warn
	console.warn = (message) => { warnings.push(message) }
	try {
		setImageDrawingStyle(env.view, 'objectFit', 'none')
		setImageDrawingStyle(env.view, 'objectPosition', 'calc(50% + 1px) 0')
		setImageDrawingStyle(env.view, 'objectPosition', '1em 2em')
		assert.equal(warnings.length, 1)
		drawImageContent(env.view)
		assert.deepEqual(env.events[2][1], { origin: { x: 10, y: -30 }, size: { width: 100, height: 200 } })
		setImageDrawingStyle(env.view, 'objectFit', '__proto__')
		assert.equal(env.view.imageScaling, 0)
	} finally { console.warn = warn; env.restore() }
})
