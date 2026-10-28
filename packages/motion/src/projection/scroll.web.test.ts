import { afterEach, describe, expect, it } from 'vitest'
import { attachHost } from '../host.web'

afterEach(() => document.body.replaceChildren())

describe('layout content coordinates', () => {
	it('removes nested ancestor scrolling while preserving viewport measurements', () => {
		const outer = document.createElement('div')
		const inner = document.createElement('div')
		const element = document.createElement('div')
		document.body.append(outer)
		outer.append(inner)
		inner.append(element)
		let layoutY = 200
		element.getBoundingClientRect = () =>
			({
				left: 40 - outer.scrollLeft - inner.scrollLeft,
				right: 140 - outer.scrollLeft - inner.scrollLeft,
				top: layoutY - outer.scrollTop - inner.scrollTop,
				bottom: layoutY + 50 - outer.scrollTop - inner.scrollTop,
			}) as DOMRect
		const adapter = attachHost(element)
		const before = adapter.measureLayout!()!
		outer.scrollTop = 80
		inner.scrollTop = 30
		outer.scrollLeft = 10
		const scrolled = adapter.measureLayout!()!
		expect(scrolled.layoutBox).toEqual(before.layoutBox)
		expect(scrolled.measuredBox.y.min).toBe(90)
		layoutY += 25
		expect(adapter.measureLayout!()!.layoutBox.y.min - before.layoutBox.y.min).toBe(25)
	})
})

it('reads scroll changes after source removal without remeasuring the removed host', () => {
	const scroller = document.createElement('div')
	const element = document.createElement('div')
	document.body.append(scroller)
	scroller.append(element)
	element.getBoundingClientRect = () => ({ left: 0, right: 100, top: 200, bottom: 250 }) as DOMRect
	const measurement = attachHost(element).measureLayout!()!
	element.remove()
	scroller.scrollTop = 80
	expect(measurement.viewportOffset!().y).toBe(-80)
})

it('does not add document or outside ancestor scroll to a fixed layout tree', () => {
	const scroller = document.createElement('div')
	scroller.scrollTop = 50
	const fixed = document.createElement('div')
	fixed.style.position = 'fixed'
	const element = document.createElement('div')
	document.body.append(scroller)
	scroller.append(fixed)
	fixed.append(element)
	element.getBoundingClientRect = () => ({ left: 10, right: 110, top: 20, bottom: 70 }) as DOMRect
	const measurement = attachHost(element).measureLayout!()!
	expect(measurement.layoutBox.y.min).toBe(20)
	fixed.scrollTop = 10
	expect(measurement.viewportOffset!().y).toBe(-10)
})
