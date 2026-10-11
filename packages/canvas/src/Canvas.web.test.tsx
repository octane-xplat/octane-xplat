// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { Canvas } from './Canvas.web.tsrx'

const roots: any[] = []
function mount(jsx: any) {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	act(() => root.render(jsx))
	return el
}

afterEach(() => {
	for (const root of roots.splice(0)) {
		act(() => root.unmount())
	}

	document.body.innerHTML = ''
})

describe('Canvas (web)', () => {
	it('fires onReady once across re-renders', () => {
		const onReady = vi.fn()
		const el = document.createElement('div')
		document.body.append(el)
		const root = createRoot(el)
		act(() => root.render(<Canvas width={10} height={10} onReady={onReady} />))
		expect(onReady).toHaveBeenCalledTimes(1)
		act(() => root.render(<Canvas width={20} height={20} onReady={onReady} />))
		expect(onReady).toHaveBeenCalledTimes(1)
	})

	it('maps string width/height to style while numbers stay attributes', () => {
		const fluid = mount(<Canvas width="100%" height="50%" />).querySelector('canvas')!
		expect(fluid.getAttribute('width')).toBeNull()
		expect(fluid.style.width).toBe('100%')
		expect(fluid.style.height).toBe('50%')

		const fixed = mount(<Canvas width={10} height={8} />).querySelector('canvas')!
		expect(fixed.getAttribute('width')).toBe('10')
		expect(fixed.getAttribute('height')).toBe('8')
		expect(fixed.style.width).toBe('')
	})
})
