import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
	registerStylesheet,
	stylesheetScope,
	stylesheetsHaveMediaRules,
	evalMediaQuery,
} from '../src/css/stylesheets.ts'

import { computeCascade, INHERITED_CSS_PROPERTIES } from '../src/css/cascade.ts'

// The cascade modules are AppKit-free: nodes here are plain objects carrying
// the ElementNode selector-adapter fields.
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
		compute(n.parent) // parent computed before child inherits from it
	}
	compute(n)
	return n
}

function compute(n: any) {
	const { style, customProps, cssKeys, inheritedKeys } = computeCascade(n, stylesheetScope())
	n.computedStyle = style
	n.computedCustomProps = customProps
	n.cssOriginKeys = cssKeys
	n.inheritedOnlyKeys = inheritedKeys
	return n
}

function recompute(n: any) {
	compute(n)
	for (const c of n.children) {
		recompute(c)
	}
}

test('class rule sets backgroundColor; removing the class resets it', () => {
	registerStylesheet('t1', '.a { background-color: #ff0000 }')
	const n = node('masonview', { classes: ['a'] })
	assert.equal(n.computedStyle.backgroundColor, '#ff0000')
	n.cssClasses = new Set()
	recompute(n)
	assert.equal(n.computedStyle.backgroundColor, undefined)
})

test('specificity, source order, and cascade layers', () => {
	registerStylesheet(
		't2',
		'@layer low { .a.b { background-color: #001 } .b { background-color: #002 } } .b { background-color: #010 }',
	)
	// unlayered beats layered regardless of layered specificity
	assert.equal(node('masonview', { classes: ['a', 'b'] }).computedStyle.backgroundColor, '#010')
	registerStylesheet('t2b', '.b { background-color: #100 } .b { background-color: #200 }')
	// later equal-specificity rule wins
	assert.equal(node('masonview', { classes: ['b'] }).computedStyle.backgroundColor, '#200')
})

test('inline beats CSS; removing the inline key falls back to CSS', () => {
	registerStylesheet('t3', '.a { color: red }')
	const n = node('label', { classes: ['a'], style: { color: 'blue' } })
	assert.equal(n.computedStyle.color, 'blue')
	n.props.style = {}
	recompute(n)
	assert.equal(n.computedStyle.color, 'red')
})

test('color/font-size inherit to child label; background-color does not', () => {
	registerStylesheet('t4', '.p { color: #123456; font-size: 20px; background-color: #abcdef }')
	const p = node('masonview', { classes: ['p'] })
	const child = node('label', { parent: p })
	assert.equal(child.computedStyle.color, '#123456')
	assert.equal(child.computedStyle.fontSize, 20)
	assert.equal(child.computedStyle.backgroundColor, undefined)
})

test('custom properties: root token, dark flip, fallback, nested override', () => {
	registerStylesheet(
		't5',
		'.ns-root { --c: #111 } .ns-dark { --c: #222 } .x { color: var(--c) } .m { color: var(--missing, blue) }',
	)
	const root = node('masonview')
	root.cssClasses = new Set(['ns-root'])
	recompute(root)
	const child = node('label', { classes: ['x'], parent: root })
	assert.equal(child.computedStyle.color, '#111')
	root.cssClasses = new Set(['ns-root', 'ns-dark'])
	recompute(root)
	assert.equal(child.computedStyle.color, '#222')
	const m = node('label', { classes: ['m'], parent: root })
	assert.equal(m.computedStyle.color, 'blue')
	// nested override
	const mid = node('masonview', { parent: root, style: { '--c': '#333' } })
	const deep = node('label', { classes: ['x'], parent: mid })
	assert.equal(deep.computedStyle.color, '#333')
})

test('same-node --c + var(--c) resolves (bug C)', () => {
	registerStylesheet('t6', '.x { --c: red; color: var(--c) }')
	assert.equal(node('label', { classes: ['x'] }).computedStyle.color, 'red')
})

test('descendant/child combinators; reparenting drops the match', () => {
	registerStylesheet('t7', '.p .k { color: red } .p > .y { color: blue }')
	const p = node('masonview', { classes: ['p'] })
	const mid = node('masonview', { parent: p })
	const x = node('label', { classes: ['k'], parent: mid })
	assert.equal(x.computedStyle.color, 'red')
	const y = node('label', { classes: ['y'], parent: p })
	assert.equal(y.computedStyle.color, 'blue')
	const other = node('masonview')
	mid.children.splice(mid.children.indexOf(x), 1)
	x.parent = other
	other.children.push(x)
	recompute(other)
	assert.equal(x.computedStyle.color, undefined)
})

test(':disabled pseudo toggles a rule', () => {
	registerStylesheet('t8', '.x:disabled { opacity: 0.5 }')
	const n = node('button', { classes: ['x'], pseudo: ['disabled'] })
	assert.equal(n.computedStyle.opacity, 0.5)
	n.cssPseudoClasses = new Set()
	recompute(n)
	assert.equal(n.computedStyle.opacity, undefined)
})

test('replace-by-id restyles and keeps registration order', () => {
	registerStylesheet('t9a', '.x { color: red }')
	registerStylesheet('t9b', '.x { color: green }')
	registerStylesheet('t9a', '.x { color: blue }') // replaces but keeps position
	// t9a was registered first, so t9b (later) still wins at equal specificity
	assert.equal(node('label', { classes: ['x'] }).computedStyle.color, 'green')
})

test('lengths: 12px/12dip/12 -> 12; 50% stays string', () => {
	registerStylesheet(
		't10',
		'.a { width: 12px } .b { width: 12dip } .c { width: 12 } .d { width: 50% }',
	)
	assert.equal(node('masonview', { classes: ['a'] }).computedStyle.width, 12)
	assert.equal(node('masonview', { classes: ['b'] }).computedStyle.width, 12)
	assert.equal(node('masonview', { classes: ['c'] }).computedStyle.width, 12)
	assert.equal(node('masonview', { classes: ['d'] }).computedStyle.width, '50%')
})

test('padding shorthand and var() expand to edges; flex-direction reaches style', () => {
	registerStylesheet(
		't11',
		'.e { --p: 4px 8px; padding: var(--p) } .f { padding: 4px 8px; flex-direction: row }',
	)
	const e = node('masonview', { classes: ['e'] })
	assert.equal(e.computedStyle.paddingTop, 4)
	assert.equal(e.computedStyle.paddingRight, 8)
	const f = node('masonview', { classes: ['f'] })
	assert.equal(f.computedStyle.paddingTop, 4)
	assert.equal(f.computedStyle.flexDirection, 'row')
})

test('sibling-dependent selector updates after inserting a sibling', () => {
	registerStylesheet('t12', '.a + .b { color: red }')
	const p = node('masonview')
	const b = node('label', { classes: ['b'], parent: p })
	assert.equal(b.computedStyle.color, undefined)
	const a = node('label', { classes: ['a'], parent: p })
	p.children.splice(p.children.indexOf(b), 0, a)
	p.children.splice(p.children.indexOf(a), 1)
	// insert a before b
	p.children.splice(p.children.indexOf(b), 0, a)
	recompute(b)
	assert.equal(b.computedStyle.color, 'red')
})

test('media evaluator: color scheme + size', () => {
	assert.equal(
		evalMediaQuery('(prefers-color-scheme: dark)', {
			width: 0,
			height: 0,
			colorScheme: 'dark',
			reducedMotion: false,
		}),
		true,
	)
	assert.equal(
		evalMediaQuery('(min-width: 100px)', {
			width: 200,
			height: 0,
			colorScheme: 'light',
			reducedMotion: false,
		}),
		true,
	)
	assert.equal(
		evalMediaQuery('(orientation: landscape)', {
			width: 200,
			height: 100,
			colorScheme: 'light',
			reducedMotion: false,
		}),
		true,
	)
	assert.equal(
		evalMediaQuery('(hover: hover)', {
			width: 0,
			height: 0,
			colorScheme: 'light',
			reducedMotion: false,
		}),
		true,
	)
	assert.equal(
		evalMediaQuery('(prefers-reduced-motion: reduce)', {
			width: 0,
			height: 0,
			colorScheme: 'light',
			reducedMotion: true,
		}),
		true,
	)
	assert.equal(stylesheetsHaveMediaRules(), false)
})

// ---- machinery-slice tests -------------------------------------------------
// The cascade machinery (markStyleDirty → flushStyleDirty → restyleNode →
// applyStyle) is sliced out of src/index.ts and run against the REAL
// computeCascade/stylesheetScope, mirroring style-reconcile.test.ts.

import { readFileSync } from 'node:fs'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'
import { onStylesheetsChanged } from '../src/css/stylesheets.ts'

const FULL_SOURCE = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
const MACHINERY = FULL_SOURCE.slice(
	FULL_SOURCE.indexOf('// ---- CSS cascade'),
	FULL_SOURCE.indexOf('function nodeScheme'),
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
		INHERITED_CSS_PROPERTIES,
		registerStylesheet,
		normalizeClass: (v: any) => String(v ?? ''),
		appKitBridge: { getColorScheme: () => ctx.scheme ?? 'light', onAppearanceChange: (l: any) => (ctx.appearanceListener = l) },
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
				if (WARNABLE.has(key) || key.startsWith('--')) continue
				if (node.inheritedOnlyKeys?.has(key)) continue
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
		`\n({ markStyleDirty, flushStyleDirty, restyleNode, setNodeInlineStyle, applyClassName, refreshCssClasses, warnUnsupportedCssProp, restyleAllContainers })`
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
	n.getChildIndex = (c: any) => n.parent ? n.parent.children.indexOf(n) : container.children.indexOf(n)
	n.getChildAt = (i: number) => n.children[i]
	n.getChildrenCount = () => n.children.length
	if (n.parent) n.parent.children.push(n)
	else container.children.push(n)
	container.nodes.set(n.id, n)
	return n
}

test('(a) CSS-origin unsupported property on 3 nodes warns exactly once', async () => {
	registerStylesheet('t-warn', '.w { foo-bar: 7px }')
	const { api, warnings } = machineryApi()
	const nodes = [sliceNode('label'), sliceNode('label'), sliceNode('label')]
	for (const n of nodes) api.applyClassName(n, 'w')
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
	const url = new URL('../src/css/stylesheets.ts?drain=' + Date.now(), import.meta.url).href
	;(globalThis as any).__xplatStylesheets = [['pre-init', '.q { color: green }']]
	const fresh: any = await import(url)
	const scope = fresh.stylesheetScope()
	const n = {
		id: 'q1', cssType: 'label', cssClasses: new Set(['q']), cssPseudoClasses: new Set(),
		parent: null, children: [], props: {},
		computedStyle: undefined, computedCustomProps: new Map(),
		getChildIndex: () => -1, getChildAt: () => undefined, getChildrenCount: () => 0,
	}
	assert.equal(computeCascade(n, scope).style.color, 'green')
	delete (globalThis as any).__xplatStylesheets
})

test('(d) N marks outside a batch produce exactly one flush', async () => {
	const { api, applyCalls } = machineryApi()
	const nodes = [sliceNode('label'), sliceNode('label'), sliceNode('label'), sliceNode('label')]
	for (const n of nodes) api.markStyleDirty(n)
	await tick()
	const firstFlush = applyCalls.length
	assert.equal(firstFlush, nodes.length, 'each dirty node restyles exactly once')
	await tick()
	assert.equal(applyCalls.length, firstFlush, 'no second flush scheduled')
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
