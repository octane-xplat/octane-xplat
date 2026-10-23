import { expect, it, vi } from 'vitest'
import type { Page } from '@nativescript/core'
import { prepareFullScreenPage } from './full-screen-page.windows'

it('preserves the Windows host measurement, content, and page identity', () => {
	const measure = vi.fn()
	const content = Object.freeze({})
	// A frozen fixture also rejects accidental mobile property writes.
	const page = Object.freeze({ measure, content })
	const prepared = prepareFullScreenPage(page as unknown as Page)
	expect(prepared).toBe(page)
	expect(prepareFullScreenPage(prepared)).toBe(page)
	prepared.measure(123, 456)
	expect(measure).toHaveBeenCalledExactlyOnceWith(123, 456)
	expect(prepared.content).toBe(content)
	expect(Object.keys(page)).toEqual(['measure', 'content'])
})
