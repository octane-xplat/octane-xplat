import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice } from './mock-globals.ts'
import { sourceWithoutImports } from './mock-globals.ts'

// NAPI registers metadata keys verbatim. Check action-site strings directly;
// inventing colons from params hides broken declarations. Native delivery and
// JS-spelled prototype lookup still require actual framework qualification.
const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))

const context = {
	elementBehaviors: new Map(),
	behaviorOf: () => undefined,
	isManualLayoutParent: (t: string) =>
		[
			'gridlayout',
			'liquidglass',
			'absolutelayout',
			'contentview',
			'actionbar',
			'docklayout',
			'wraplayout',
			'rootlayout',
		].includes(t),
	registerElementType: () => {},

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

const { ButtonActionTarget } = runSlice(
	source.slice(
		source.indexOf('class ButtonActionTarget'),
		source.indexOf('const buttonActionTarget'),
	) + '\n({ ButtonActionTarget })',
	context,
)

const { MenuActionTarget } = runSlice(
	source.slice(
		source.indexOf('class MenuActionTarget'),
		source.indexOf('menuActionTarget = MenuActionTarget.new()'),
	) + '\n({ MenuActionTarget })',
	context,
)

const selectorsByTarget = {
	buttonActionTarget: new Set(Object.keys(ButtonActionTarget.ObjCExposedMethods)),
	menuActionTarget: new Set(Object.keys(MenuActionTarget.ObjCExposedMethods)),
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
		/initWithTitleActionKeyEquivalent\(\s*[^,\n]+,\s*'([^']+)'\s*,\s*'[^']*'\s*,?\s*\)/g,
	)) {
		yield { target: nearbyTarget(match.index), selector: match[1] }
	}

	// <view>.action = '<selector>' — the view's `.target` is assigned adjacent.
	for (const match of source.matchAll(/\.action\s*=\s*'([^']+)'/g)) {
		yield { target: nearbyTarget(match.index), selector: match[1] }
	}
}

test('every assigned action string has an exact metadata selector, without inferred colons', () => {
	const sites = [...actionSites()]

	// Guard against a pattern silently matching nothing after a refactor.
	// Click-action consolidation (6ddf022f5) removed a duplicate viewPressed:
	// registration — 11 literal action sites remain.
	assert.equal(sites.length, 11)

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

test('text edit/focus delegates declare the exact one-argument selectors and keep their JS methods', () => {
	for (const name of ['controlTextDidChange', 'textFieldSubmitted', 'textDidChange', 'controlTextDidBeginEditing', 'controlTextDidEndEditing', 'textDidBeginEditing', 'textDidEndEditing']) {
		const selector = name + ':'
		assert.equal(ButtonActionTarget.ObjCExposedMethods[selector]?.params.length, 1, selector)
		assert.equal(ButtonActionTarget.ObjCExposedMethods[name], undefined, name)
		assert.equal(typeof ButtonActionTarget.prototype[name], 'function', name)
	}
})

test('control/menu action metadata uses full selectors and native registration exposes the menu prototype', () => {
	for (const [target, name] of [[ButtonActionTarget, 'buttonPressed'], [ButtonActionTarget, 'controlChanged'], [MenuActionTarget, 'menuItemSelected']]) {
		assert.equal(target.ObjCExposedMethods[name + ':']?.params.length, 1)
		assert.equal(target.ObjCExposedMethods[name], undefined)
		assert.equal(typeof target.prototype[name], 'function')
	}
	const menuSource = source.slice(source.indexOf('class MenuActionTarget'), source.indexOf('menuActionTarget = MenuActionTarget.new()'))
	assert.match(menuSource, /registerGestureClass\(this\)/)
})
