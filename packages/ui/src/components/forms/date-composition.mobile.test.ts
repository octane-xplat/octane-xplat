import { afterEach, expect, it, vi } from 'vitest'
import { hasDateComposition } from './date-composition'
import { hasDateComposition as appKitComposition } from './date-composition.macos'

afterEach(() => vi.unstubAllGlobals())

it('defers iOS marked text and AppKit field-editor composition', () => {
	expect(hasDateComposition({ ios: { markedTextRange: {} } })).toBe(true)
	expect(hasDateComposition({ ios: { markedTextRange: null } })).toBe(false)
	expect(appKitComposition({ currentEditor: () => ({ hasMarkedText: true }) })).toBe(true)
	expect(appKitComposition({ currentEditor: { hasMarkedText: () => false } })).toBe(false)
	expect(hasDateComposition(undefined, { keyCode: 229 })).toBe(true)
})

it('defers Android composing spans and accepts completed editing', () => {
	vi.stubGlobal('android', {
		view: {
			inputmethod: {
				BaseInputConnection: { getComposingSpanStart: (editable: any) => editable.start },
			},
		},
	})

	expect(hasDateComposition({ android: { getText: () => ({ start: 0 }) } })).toBe(true)
	expect(hasDateComposition({ android: { getText: () => ({ start: -1 }) } })).toBe(false)
})
