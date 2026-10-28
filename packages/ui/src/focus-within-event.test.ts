import { expect, it } from 'vitest'
import { normalizeFocusWithinEvent } from './focus-within-event'

it('preserves full focus payloads and omitted control events', () => {
	const event = { type: 'focus', target: {}, currentTarget: {}, relatedTarget: null, preventDefault() {}, stopPropagation() {} }
	expect(normalizeFocusWithinEvent(event, 'focus')).toBe(event)
	expect(normalizeFocusWithinEvent(undefined, 'blur')).toBeUndefined()
})

it('normalizes minimal native events without inventing related-target information', () => {
	const object = {}
	const event = normalizeFocusWithinEvent({ object, eventName: 'blur' }, 'blur')
	expect(event).toMatchObject({ type: 'blur', target: object, currentTarget: object, relatedTarget: null })
	expect(() => { event?.preventDefault(); event?.stopPropagation() }).not.toThrow()
})
