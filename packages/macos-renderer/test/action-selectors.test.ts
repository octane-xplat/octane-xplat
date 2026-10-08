import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

// AppKit resolves target/action selectors by name — a method exposed with one
// param registers `name:`, so a bare `'name'` action string silently never
// fires. Derive each target class's registered selector set from its real
// ObjCExposedMethods and assert every action string in the source resolves
// against the target it is attached to.
const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const context = {
	NSObject: class {},
	NSButton: class {},
	NSMenuItem: class {},
	NSPanGestureRecognizer: class {},
	NSNotification: class {},
	NSTextViewDelegate: class {},
	interop: { types: { void: 'void', bool: 'bool', id: 'id' } },
	NativeClass() {},
}

const { ButtonActionTarget } = runInNewContext(
	source.slice(
		source.indexOf('class ButtonActionTarget'),
		source.indexOf('const buttonActionTarget'),
	) + '\n({ ButtonActionTarget })',
	context,
)

const { MenuActionTarget } = runInNewContext(
	source.slice(
		source.indexOf('class MenuActionTarget'),
		source.indexOf('menuActionTarget = MenuActionTarget.new()'),
	) + '\n({ MenuActionTarget })',
	context,
)

// The runtime registers `name` verbatim when it already contains ':',
// otherwise `name` + ':' per declared param.
function registeredSelectors(klass) {
	return new Set(
		Object.entries(klass.ObjCExposedMethods).map(([name, method]) =>
			name.includes(':') ? name : name + ':'.repeat(method.params?.length ?? 0),
		),
	)
}

const selectorsByTarget = {
	buttonActionTarget: registeredSelectors(ButtonActionTarget),
	menuActionTarget: registeredSelectors(MenuActionTarget),
}

// Sites whose target is assigned as a property next to the action string
// rather than passed inline; resolve the nearest `.target = <expr>` around it.
function nearbyTarget(index) {
	let best = null
	for (const match of source.matchAll(/\.target\s*=\s*([\w$]+)/g)) {
		const distance = Math.abs(match.index - index)
		if (distance < 500 && (best === null || distance < best.distance)) {
			best = { target: match[1], distance }
		}
	}

	return best?.target
}

function* actionSites() {
	// initWithTargetAction(<target>, '<selector>')
	for (const match of source.matchAll(/initWithTargetAction\(\s*([\w$]+)\s*,\s*'([^']+)'/g)) {
		yield { target: match[1], selector: match[2] }
	}

	// buttonWithTitleTargetAction(<title>, <target>, '<selector>')
	for (const match of source.matchAll(
		/buttonWithTitleTargetAction\([\s\S]*?,\s*([\w$]+)\s*,\s*'([^']+)'\s*,?\s*\)/g,
	)) {
		yield { target: match[1], selector: match[2] }
	}

	// initWithTitleActionKeyEquivalent(<title>, '<selector>', '<key>') — the
	// item's `.target` is assigned right after.
	for (const match of source.matchAll(
		/initWithTitleActionKeyEquivalent\([\s\S]*?,\s*'([^']+)'\s*,\s*'[^']*'\s*,?\s*\)/g,
	)) {
		yield { target: nearbyTarget(match.index), selector: match[1] }
	}

	// <view>.action = '<selector>' — the view's `.target` is assigned adjacent.
	for (const match of source.matchAll(/\.action\s*=\s*'([^']+)'/g)) {
		yield { target: nearbyTarget(match.index), selector: match[1] }
	}
}

test('registered ObjC action selectors match every assigned action string', () => {
	const sites = [...actionSites()]

	// Guard against a pattern silently matching nothing after a refactor.
	assert.equal(sites.length, 9)

	for (const { target, selector } of sites) {
		const registered = selectorsByTarget[target]
		assert.ok(
			registered,
			`action '${selector}' is attached to '${target}', which has no ObjCExposedMethods entry`,
		)

		assert.ok(
			registered.has(selector),
			`'${target}' does not register selector '${selector}' — registered: ${[...registered].join(', ')}`,
		)
	}
})
