// The cascade machinery (markStyleDirty → flushStyleDirty → restyleNode →
// applyStyle) is sliced out of src/index.ts and run against the REAL
// @octane-xplat/css-engine computeCascade/stylesheetScope, mirroring
// style-reconcile.test.ts.
//
// ---- machinery-slice tests -------------------------------------------------
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'
import {
	computeCascade,
	INHERITED_CSS_PROPERTIES,
	registerStylesheet,
	stylesheetPseudoClasses,
	stylesheetScope,
	onStylesheetsChanged,
} from '@octane-xplat/css-engine'

const FULL_SOURCE = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
const MACHINERY = FULL_SOURCE.slice(
	FULL_SOURCE.indexOf('// ---- CSS cascade'),
	FULL_SOURCE.indexOf('function syncNativeColors'),
)

const RESTYLE_ALL = FULL_SOURCE.slice(
	FULL_SOURCE.indexOf('function restyleAllContainers'),
	FULL_SOURCE.indexOf('onStylesheetsChanged(restyleAllContainers)'),
)

const tick = () => new Promise<void>((r) => setImmediate(r))

const WARNABLE = new Set(['backgroundColor', 'paddingTop', 'color', 'fontSize', 'opacity'])

function machineryApi(extra: Record<string, any> = {}) {
	const applyCalls: any[] = []
	const warnings: string[] = []
	const ctx: any = {
		console: { warn: (m: string) => warnings.push(m) },
		queueMicrotask,
		computeCascade,
		stylesheetScope,
		stylesheetPseudoClasses,
		INHERITED_CSS_PROPERTIES,
		registerStylesheet,
		normalizeClass: (v: any) => String(v ?? ''),
		appKitBridge: {
			getColorScheme: () => ctx.scheme ?? 'light',
			onAppearanceChange: (l: any) => (ctx.appearanceListener = l),
		},
		NSWorkspace: { sharedWorkspace: { accessibilityDisplayShouldReduceMotion: false } },
		behaviorOf: () => undefined,
		queueLayoutReconcile: () => {},
		MARGIN_SIDES: {},
		setStyleEnvironment: (fn: any) => (ctx.mediaEnv = fn),
		onStylesheetsChanged,
		appKitContainers: new Set(),
		// Records + routes warnings the way applyStyle's unsupported branch does.
		applyStyle(node: any, style: any) {
			applyCalls.push(node)
			for (const key of Object.keys(style ?? {})) {
				if (WARNABLE.has(key) || key.startsWith('--')) {
					continue
				}

				if (node.inheritedOnlyKeys?.has(key)) {
					continue
				}

				if (node.cssOriginKeys?.has(key)) {
					ctx.api.warnUnsupportedCssProp(node, key)
				} else {
					console.warn('[macos-style] ignored unsupported style.' + key)
				}
			}
			node.appliedStyle = style
		},
		...extra,
	}
	const code =
		MACHINERY +
		RESTYLE_ALL +
		`\n({ markStyleDirty, flushStyleDirty, restyleNode, setNodeInlineStyle, applyClassName, refreshCssClasses, warnUnsupportedCssProp, restyleAllContainers, setPseudoClass })`
	ctx.api = runSlice(code, ctx)
	// Module init registers restyleAllContainers as the sheet-change listener —
	// done here explicitly (the slice's top-level call is excluded).
	onStylesheetsChanged(ctx.api.restyleAllContainers)
	return { api: ctx.api, ctx, applyCalls, warnings }
}

function sliceNode(type: string, opts: any = {}) {
	const container =
		opts.container ??
		({ nodes: new Map(), layoutDirty: null, children: [], portalTargets: new Map() } as any)
	const n: any = {
		id: opts.id ?? Math.floor(Math.random() * 1e9),
		type,
		view: {},
		cssType: type,
		cssClasses: new Set(),
		cssPseudoClasses: new Set(),
		parent: opts.parent ?? null,
		children: [] as any[],
		props: { style: opts.style },
		container,
		computedStyle: undefined,
		computedCustomProps: new Map(),
	}
	n.getChildIndex = (_c: any) =>
		n.parent ? n.parent.children.indexOf(n) : container.children.indexOf(n)
	n.getChildAt = (i: number) => n.children[i]
	n.getChildrenCount = () => n.children.length
	if (n.parent) {
		n.parent.children.push(n)
	} else {
		container.children.push(n)
	}
	container.nodes.set(n.id, n)
	return n
}

// Minimal counterpart of the css-engine cascade test's node() helper, for the
// single Application.addCss case below.
let seq = 0
function node(type: string, opts: any = {}) {
	const n: any = {
		id: String(opts.id ?? ++seq),
		type,
		cssType: type,
		cssClasses: new Set(opts.classes ?? []),
		cssPseudoClasses: new Set(opts.pseudo ?? []),
		parent: null,
		children: [] as any[],
		props: { className: (opts.classes ?? []).join(' '), style: opts.style },
		computedStyle: {},
		computedCustomProps: new Map(),
	}
	n.getChildIndex = (c: any) => n.children.indexOf(c)
	n.getChildAt = (i: number) => n.children[i]
	n.getChildrenCount = () => n.children.length
	const { style, customProps, cssKeys, inheritedKeys } = computeCascade(n, stylesheetScope())
	n.computedStyle = style
	n.computedCustomProps = customProps
	n.cssOriginKeys = cssKeys
	n.inheritedOnlyKeys = inheritedKeys
	return n
}

test('(a) CSS-origin unsupported property on 3 nodes warns exactly once', async () => {
	registerStylesheet('t-warn', '.w { foo-bar: 7px }')
	const { api, warnings } = machineryApi()
	const nodes = [sliceNode('label'), sliceNode('label'), sliceNode('label')]
	for (const n of nodes) {
		api.applyClassName(n, 'w')
	}
	await tick()
	assert.equal(
		warnings.filter((m) => m.includes('fooBar')).length,
		1,
		'warn-once per property name, not per node',
	)
})

test('(b) inherited color on a masonview produces no warning', async () => {
	registerStylesheet('t-inherit-warn', '.p { color: #123456; foo-bar: 1px }')
	const { api, warnings } = machineryApi()
	const p = sliceNode('masonview')
	api.applyClassName(p, 'p')
	sliceNode('masonview', { parent: p })
	await tick()
	assert.equal(
		warnings.filter((m) => m.includes('color')).length,
		0,
		'inherited-only keys are never warned',
	)
})

test('(c) __xplatStylesheets queued before module load is applied', async () => {
	const engineEntry = createRequire(import.meta.url).resolve('@octane-xplat/css-engine')
	const url =
		pathToFileURL(engineEntry.replace(/index\.ts$/, 'stylesheets.ts')).href + '?drain=' + Date.now()
	;(globalThis as any).__xplatStylesheets = [['pre-init', '.q { color: green }']]
	const fresh: any = await import(url)
	const scope = fresh.stylesheetScope()
	const n = {
		id: 'q1',
		cssType: 'label',
		cssClasses: new Set(['q']),
		cssPseudoClasses: new Set(),
		parent: null,
		children: [],
		props: {},
		computedStyle: undefined,
		computedCustomProps: new Map(),
		getChildIndex: () => -1,
		getChildAt: () => undefined,
		getChildrenCount: () => 0,
	}
	assert.equal(computeCascade(n, scope).style.color, 'green')
	delete (globalThis as any).__xplatStylesheets
})

test('(d) N marks outside a batch produce exactly one flush', async () => {
	const { api, applyCalls } = machineryApi()
	const nodes = [sliceNode('label'), sliceNode('label'), sliceNode('label'), sliceNode('label')]
	for (const n of nodes) {
		api.markStyleDirty(n)
	}
	await tick()
	const firstFlush = applyCalls.length
	assert.equal(firstFlush, nodes.length, 'each dirty node restyles exactly once')
	await tick()
	assert.equal(applyCalls.length, firstFlush, 'no second flush scheduled')
})

test('(j) a restyle that resolves to the same style skips applyStyle', async () => {
	const { api, applyCalls } = machineryApi()
	const n = sliceNode('label', { style: { opacity: 0.5 } })
	api.markStyleDirty(n)
	await tick()
	assert.equal(applyCalls.length, 1)
	api.markStyleDirty(n)
	await tick()
	assert.equal(applyCalls.length, 1, 'unchanged effective style is not re-applied')
	api.setNodeInlineStyle(n, { opacity: 0.25 })
	await tick()
	assert.equal(applyCalls.length, 2)
})

test('(k) an out-of-batch flush queues style-driven layout into one drain', async () => {
	let syncLayouts = 0
	const drained: any[] = []
	const { api } = machineryApi({
		applyStyle(node: any, style: any) {
			node.appliedStyle = style
			// Mirrors queueLayoutReconcile: batch-queued when a layout batch is open.
			if (node.container.layoutDirty) {
				node.container.layoutDirty.add(node.parent ?? node)
			} else {
				syncLayouts++
			}
		},
		reconcileLayoutParent: (parent: any) => drained.push(parent),
	})
	const container = { nodes: new Map(), layoutDirty: null, children: [], portalTargets: new Map() }
	const parent = sliceNode('masonview', { container, style: { opacity: 1 } })
	const a = sliceNode('label', { container, parent, style: { opacity: 0.5 } })
	const b = sliceNode('label', { container, parent, style: { opacity: 0.25 } })
	for (const n of [parent, a, b]) {
		api.markStyleDirty(n)
	}
	await tick()
	assert.equal(syncLayouts, 0, 'no synchronous per-apply layout')
	assert.deepEqual(drained, [parent], 'one drain per dirty layout parent')
	assert.equal(container.layoutDirty, null, 'the flush closes the layout batch it opened')
})

test('(e) root classes follow the appearance bridge', async () => {
	const { api, ctx } = machineryApi()
	const container = { nodes: new Map(), layoutDirty: null, children: [], portalTargets: new Map() }
	ctx.appKitContainers.add(container)
	ctx.scheme = 'dark'
	const root = sliceNode('masonview', { container })
	api.markStyleDirty(root)
	api.flushStyleDirty(container)
	assert.ok(root.cssClasses.has('ns-root'))
	assert.ok(root.cssClasses.has('ns-macos'))
	assert.ok(root.cssClasses.has('ns-dark'))
	ctx.scheme = 'light'
	api.restyleAllContainers()
	await tick()
	assert.ok(root.cssClasses.has('ns-light'))
	assert.ok(!root.cssClasses.has('ns-dark'))
})

test('(f) node marked dirty then destroyed is skipped, not restyled', () => {
	const { api, applyCalls } = machineryApi()
	const container = { nodes: new Map(), layoutDirty: null, children: [], portalTargets: new Map() }
	const n = sliceNode('label', { container })
	api.markStyleDirty(n)
	container.nodes.delete(n.id)
	api.flushStyleDirty(container)
	assert.equal(applyCalls.length, 0)
})

test('(g) registerStylesheet after mount restyles live nodes via appKitContainers', async () => {
	const { api, ctx } = machineryApi()
	const container = { nodes: new Map(), layoutDirty: null, children: [], portalTargets: new Map() }
	ctx.appKitContainers.add(container)
	const n = sliceNode('label', { container })
	api.applyClassName(n, 'late')
	await tick()
	registerStylesheet('t-late', '.late { color: magenta }')
	await tick()
	assert.equal(n.computedStyle.color, 'magenta')
})

test('(h) changing an inherited inline prop restyles the subtree', async () => {
	const { api } = machineryApi()
	const container = { nodes: new Map(), layoutDirty: null, children: [], portalTargets: new Map() }
	const p = sliceNode('masonview', { container })
	const child = sliceNode('label', { parent: p, container })
	api.setNodeInlineStyle(p, { color: 'red' })
	await tick()
	assert.equal(child.computedStyle.color, 'red')
	api.setNodeInlineStyle(p, { color: 'blue' })
	await tick()
	assert.equal(child.computedStyle.color, 'blue', 'subtree restyles when inherited values change')
})

test('(i) className-driven padding + flex-direction reach computedStyle for mason', async () => {
	registerStylesheet('t-mason', '.pad { padding: 4px 8px; flex-direction: row }')
	const { api } = machineryApi()
	const n = sliceNode('masonview')
	api.applyClassName(n, 'pad')
	await tick()
	// mason's styleDict reads node.computedStyle ?? props.style — these are the
	// keys it consumes.
	assert.equal(n.computedStyle.paddingTop, 4)
	assert.equal(n.computedStyle.paddingRight, 8)
	assert.equal(n.computedStyle.flexDirection, 'row')
})

test('Application.addCss registers a stylesheet (theme-css-inject path)', async () => {
	const { Application } = await import('../src/native-core-shim.ts')
	Application.addCss('.injected { color: teal }')
	const n = node('label', { classes: ['injected'] })
	assert.equal(n.computedStyle.color, 'teal')
})

test('(l) a used pseudo-class restyles; an unused one only updates the set', async () => {
	registerStylesheet('t-pseudo', '.tp:hover { color: #111 } .tp:focus { color: #222 }')
	const { api, applyCalls } = machineryApi()
	const n = sliceNode('label')
	api.applyClassName(n, 'tp')
	await tick()
	applyCalls.length = 0

	api.setPseudoClass(n, 'hover', true)
	await tick()
	assert.equal(applyCalls.length, 1, 'registered :hover selector forces a restyle')
	assert.ok(n.cssPseudoClasses.has('hover'))

	api.setPseudoClass(n, 'bogusstate', true)
	await tick()
	assert.equal(applyCalls.length, 1, 'unused pseudo-classes must not flush a subtree')
	assert.ok(n.cssPseudoClasses.has('bogusstate'), 'the set still records the state')
})
