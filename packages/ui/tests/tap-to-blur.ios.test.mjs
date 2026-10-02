import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(new URL('../src/tap-to-blur.ios.ts', import.meta.url), 'utf8')
const compiled = ts.transpile(source, {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES2022,
	experimentalDecorators: true,
})

test('iOS tap-to-blur registers lazily without NativeClass and reuses its native class', () => {
	const context = vm.createContext({ exports: {} })
	vm.runInContext(compiled, context)
	const { attachTapToBlur } = context.exports
	const registrations = []
	const added = []
	const removed = []
	const editing = []
	const window = {
		addGestureRecognizer: (recognizer) => added.push(recognizer),
		removeGestureRecognizer: (recognizer) => removed.push(recognizer),
		endEditing: (force) => editing.push(force),
	}

	Object.assign(context, {
		NSObject: class {
			static extend(methods, options) {
				registrations.push(options)
				return { new: () => Object.create(methods) }
			}
		},
		UIGestureRecognizerDelegate: {},
		interop: { types: { void: {}, id: {} } },
		UITapGestureRecognizer: {
			alloc: () => ({ initWithTargetAction: (target, action) => ({ target, action }) }),
		},
		UITextField: { class: () => 'field' },
		UITextView: { class: () => 'text' },
		UIApplication: {
			sharedApplication: { connectedScenes: { allObjects: [] }, keyWindow: window },
		},
	})

	const first = {}
	const detachFirst = attachTapToBlur(first)
	const detachDuplicate = attachTapToBlur(first)
	const detachSecond = attachTapToBlur({})
	assert.equal(registrations.length, 1)
	assert.equal(registrations[0].name, 'XplatTapToBlurRecognizerTarget')
	assert.equal(registrations[0].protocols[0], context.UIGestureRecognizerDelegate)
	assert.equal(registrations[0].exposedMethods['tap:'].params[0], context.interop.types.id)
	assert.equal(added.length, 1)
	const recognizer = added[0]
	assert.equal(recognizer.action, 'tap:')
	assert.equal(recognizer.delegate, recognizer.target)
	assert.equal(recognizer.cancelsTouchesInView, false)
	const shouldReceive = (view) =>
		recognizer.delegate.gestureRecognizerShouldReceiveTouch(recognizer, { view })

	for (const kind of ['field', 'text']) {
		const editable = { isKindOfClass: (type) => type === kind }
		assert.equal(shouldReceive({ isKindOfClass: () => false, superview: editable }), false)
	}

	assert.equal(shouldReceive({ isKindOfClass: () => false }), true)
	recognizer.target.tap(recognizer)
	assert.deepEqual(editing, [true])
	detachDuplicate()
	detachFirst()
	assert.equal(removed.length, 0)
	detachSecond()
	assert.deepEqual(removed, [recognizer])
	const detachAgain = attachTapToBlur({})
	assert.equal(registrations.length, 1)
	assert.equal(added.length, 2)
	detachAgain()
	assert.equal(removed.length, 2)
})
