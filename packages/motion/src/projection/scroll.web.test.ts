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
