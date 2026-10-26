import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
	registerStylesheet,
	stylesheetScope,
	stylesheetsHaveMediaRules,
	evalMediaQuery,
} from '../src/stylesheets.ts'

import { computeCascade, INHERITED_CSS_PROPERTIES } from '../src/cascade.ts'

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

test('an element prop named like a style property outranks CSS and inheritance', () => {
	registerStylesheet('t-local-prop', '.lp-root { font-size: 16px } .lp-label { color: red }')
	const root = node('masonview', { classes: ['lp-root'] })
	const label = node('label', { parent: root, classes: ['lp-label'] })
	label.props.fontSize = 14
	label.props.color = 'blue'
	compute(label)
	assert.equal(
		label.computedStyle.fontSize,
		undefined,
		'the fontSize prop governs, not the inherited 16',
	)
	assert.equal(label.computedStyle.color, undefined, 'the color prop outranks the CSS rule')
	label.props.style = { fontSize: 12 }
	compute(label)
	assert.equal(label.computedStyle.fontSize, 12, 'inline style still wins over the prop')
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
