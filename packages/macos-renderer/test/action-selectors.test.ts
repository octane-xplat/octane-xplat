import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

// The NAPI runtime registers exposed keys verbatim. Preserve the action-site
// arity check, but verify gesture registration against exact metadata keys and
// prototype methods below. Arity alone does not establish native delivery.
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
	NSTextFieldDelegate: class {},
	interop: { types: { void: 'void', bool: 'bool', id: 'id' } },
	NativeClass() {},
	registerGestureClass() {},
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

// An intended selector's arity follows its declared parameter count. This
// legacy convention is not the runtime's registration algorithm.
function intendedSelectors(klass) {
	return new Set(
		Object.entries(klass.ObjCExposedMethods).map(([name, method]) =>
			name.includes(':') ? name : name + ':'.repeat(method.params?.length ?? 0),
		),
	)
}

const selectorsByTarget = {
	buttonActionTarget: intendedSelectors(ButtonActionTarget),
	menuActionTarget: intendedSelectors(MenuActionTarget),
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

test('assigned action strings retain declared arity and gestures use explicit ObjC keys', () => {
	const sites = [...actionSites()]

	// Guard against a pattern silently matching nothing after a refactor.
	assert.equal(sites.length, 9)

	for (const { target, selector } of sites) {
		if (target === 'buttonActionTarget' && ['viewPressed:', 'viewPanned:'].includes(selector)) {
			assert.ok(ButtonActionTarget.ObjCExposedMethods[selector])
			assert.equal(typeof ButtonActionTarget.prototype[selector], 'function')
		}

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
