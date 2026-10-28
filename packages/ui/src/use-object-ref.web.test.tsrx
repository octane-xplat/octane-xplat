// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { useObjectRef } from './use-object-ref'

// useObjectRef — the object form must stay readable after render and still
// forward host assignments to the caller's ref.

describe('useObjectRef (DOM renderer)', () => {
	it('exposes current and forwards assignments to the original ref', () => {
		const callback = vi.fn()
		let objectRef: { current: unknown } | undefined

		function Reader() @{
			objectRef = useObjectRef<HTMLElement>(callback)

			<div ref={objectRef as any} />
		}

		const el = document.createElement('div')
		document.body.appendChild(el)
		const root = createRoot(el)
		act(() => root.render(<Reader />))

		expect(objectRef?.current).toBe(el.firstElementChild)
		expect(callback).toHaveBeenCalledWith(el.firstElementChild)

		act(() => root.unmount())
		expect(callback).toHaveBeenLastCalledWith(null)
		el.remove()
	})
})
