// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, createRoot } from 'octane'
import { Meter } from './Meter.web.tsrx'

const roots: any[] = []
function mount(props: any = {}) {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	act(() => root.render(<Meter {...props} />))
	return el.firstElementChild as HTMLElement
}

afterEach(() => {
	for (const root of roots.splice(0)) {
		act(() => root.unmount())
	}

	document.body.innerHTML = ''
})

describe('Meter web accessibility', () => {
	it('exposes the meter role with range and value', () => {
		const host = mount({ value: 30, accessibilityLabel: 'Storage used' })
		expect(host.getAttribute('role')).toBe('meter progressbar')
		expect(host.getAttribute('aria-valuemin')).toBe('0')
		expect(host.getAttribute('aria-valuemax')).toBe('100')
		expect(host.getAttribute('aria-valuenow')).toBe('30')
		expect(host.getAttribute('aria-label')).toBe('Storage used')
	})

	it('honors minValue/maxValue and clamps the value into the range', () => {
		const host = mount({ value: 500, minValue: 100, maxValue: 400 })
		expect(host.getAttribute('aria-valuemin')).toBe('100')
		expect(host.getAttribute('aria-valuemax')).toBe('400')
		expect(host.getAttribute('aria-valuenow')).toBe('400')
	})

	it('keeps the deprecated max alias working when maxValue is unset', () => {
		const host = mount({ value: 40, max: 50 })
		expect(host.getAttribute('aria-valuemax')).toBe('50')
		expect(host.getAttribute('aria-valuenow')).toBe('40')
	})

	it('reports valueLabel as aria-valuetext', () => {
		const host = mount({ value: 6, maxValue: 10, valueLabel: '6 GB of 10 GB used' })
		expect(host.getAttribute('aria-valuetext')).toBe('6 GB of 10 GB used')
	})
})
