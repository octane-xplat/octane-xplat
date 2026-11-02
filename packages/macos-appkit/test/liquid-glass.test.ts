import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice } from './mock-globals.ts'
import { sourceWithoutImports } from './mock-globals.ts'

// Exercise the production host construction and layout dispatch, not replicas.
const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))

const fn = (name: string) => {
	const start = source.indexOf(`function ${name}(`)
	assert.ok(start >= 0, name)
	return source.slice(start, source.indexOf('\nfunction ', start + 1))
}

const liquidGlassClass = source.slice(
	source.indexOf('class LiquidGlassView'),
	source.indexOf('\nclass ActionBarHost'),
)

const supportedSets = source.slice(
	source.indexOf('const VIEW_PARENT_TYPES'),
	source.indexOf('function typeHasView'),
)

class NSView {
	subviews: any[] = []
	constraints: any[] = []
	translatesAutoresizingMaskIntoConstraints = true
	leadingAnchor = this.anchor()
	trailingAnchor = this.anchor()
	topAnchor = this.anchor()
	bottomAnchor = this.anchor()

	private anchor() {
		return {
			constraintEqualToAnchor: (other: any) => {
				const constraint = { other, active: false }
				this.constraints.push(constraint)
				return constraint
			},
		}
	}

	addSubview(child: any) {
		this.subviews.push(child)
		child.superview = this
	}

	removeFromSuperview() {
		this.superview = null
	}

	layout() {}

	static alloc() {
		return { initWithFrame: () => new this() }
	}
}

class NSVisualEffectView extends NSView {
	material = -1
	blendingMode = -1
}

function makeContext() {
	return {
		NSView,
		NSVisualEffectView,
		NSVisualEffectMaterial: { UnderWindowBackground: 21 },
		NSVisualEffectBlendingMode: { Behind: 0 },
		NativeClass: () => {},
		NSNotificationCenter: {
			defaultCenter: {
				addObserverForNameObjectQueueUsingBlock: (
					_name: any,
					_obj: any,
					_q: any,
					handler: any,
				) => ({ handler }),
			},
		},
		NSViewFrameDidChangeNotification: 'frame-changed',
		gridLayoutNodesByView: new Map(),
		layoutGridChildren: () => {},
		queueLayoutReconcile: () => {},
	}
}

test('liquidglass is a supported view-parent type', () => {
	const { SUPPORTED_TYPES, VIEW_PARENT_TYPES, assertSupportedType, typeHasView } = runSlice(
		supportedSets +
			fn('typeHasView') +
			fn('assertSupportedType') +
			'\n;({ SUPPORTED_TYPES, VIEW_PARENT_TYPES, assertSupportedType, typeHasView })',
		{ elementBehaviors: new Map() },
	)

	assert.ok(SUPPORTED_TYPES.has('liquidglass'))
	assert.ok(VIEW_PARENT_TYPES.has('liquidglass'))
	assert.equal(typeHasView('liquidglass'), true)
	assert.doesNotThrow(() => assertSupportedType('liquidglass'))
	assert.throws(() => assertSupportedType('liquidglassview'), /does not support/)
})

test('makeLiquidGlass pins a glass material behind grid children', () => {
	const context = makeContext()
	const { makeLiquidGlass } = runSlice(
		liquidGlassClass + '\n' + fn('makeLiquidGlass') + '\n;({ makeLiquidGlass })',
		context,
	)

	const node = { id: 1, type: 'liquidglass', container: {} }
	const host = makeLiquidGlass(node)
	assert.equal(host.translatesAutoresizingMaskIntoConstraints, false)
	assert.equal(host.postsFrameChangedNotifications, true)
	assert.ok(node.glassGeometryObserver)
	assert.equal(host.subviews.length, 1)

	const backdrop = host.subviews[0]
	assert.ok(backdrop instanceof NSVisualEffectView)
	assert.equal(node.glassBackdrop, backdrop)
	assert.equal(backdrop.material, 21)
	assert.equal(backdrop.blendingMode, 0)
	assert.equal(backdrop.translatesAutoresizingMaskIntoConstraints, false)
	assert.equal(backdrop.constraints.length, 4)
	assert.ok(backdrop.constraints.every((constraint: any) => constraint.active === true))
})

test('a frame change queues the host layout reconcile', () => {
	const context = makeContext()
	const calls: any[] = []
	context.queueLayoutReconcile = (container: any, node: any) => calls.push([container, node])
	const { makeLiquidGlass } = runSlice(
		liquidGlassClass + '\n' + fn('makeLiquidGlass') + '\n;({ makeLiquidGlass })',
		context,
	)

	const node = { id: 2, type: 'liquidglass', container: { id: 'c' } }
	const host = makeLiquidGlass(node)
	context.gridLayoutNodesByView.set(host, node)
	node.glassGeometryObserver.handler()
	assert.deepEqual(calls, [[node.container, node]])
})

test('the host layout dispatches to the registered behavior for the node', () => {
	const context = makeContext()
	const calls: any[] = []
	context.behaviorOf = (type: string) =>
		type === 'liquidglass' ? { layout: (node: any) => calls.push(node) } : undefined
	const { makeLiquidGlass } = runSlice(
		liquidGlassClass + '\n' + fn('makeLiquidGlass') + '\n;({ makeLiquidGlass })',
		context,
	)

	const node = { id: 7, type: 'liquidglass', container: {} }
	const host = makeLiquidGlass(node)
	context.gridLayoutNodesByView.set(host, node)
	host.layout()
	assert.deepEqual(calls, [node])
})
// Implicit-cell overlap + row/col placement now run through Mason;
// covered by the mason-style translation test and the runtime cutover probe.
