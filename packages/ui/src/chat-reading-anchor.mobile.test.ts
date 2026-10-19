import { expect, it, vi } from 'vitest'
import { chatHost } from './chat-scroll-host'
import { bindChatReadingAnchor } from './chat-reading-anchor'
import { chatMessageKey, markChatRow } from './chat-scroll-state'

it('retains the same row pixel across prepend, growth above, append and manual movement', () => {
	let following = false
	const readers = new Set<() => void>()
	const viewport: any = {
		verticalOffset: 300,
		scrollableHeight: 2000,
		getActualSize: () => ({ height: 400 }),
		on(_name: string, read: () => void) {
			readers.add(read)
		},
		off(_name: string, read: () => void) {
			readers.delete(read)
		},
		scrollToVerticalOffset(value: number) {
			this.verticalOffset = value
			readers.forEach((read) => read())
		},
	}
	const content: any = {
		rows: [] as any[],
		getChildrenCount() {
			return this.rows.length
		},
		getChildAt(index: number) {
			return this.rows[index]
		},
	}
	const row = (y: number) => {
		const value = {
			parent: content,
			y,
			getLocationRelativeTo() {
				return { y: this.y - viewport.verticalOffset }
			},
			getActualSize() {
				return { height: 64 }
			},
		}
		markChatRow(value)
		return value
	}
	content.rows = Array.from({ length: 30 }, (_, i) => row(i * 64))
	const anchor = content.rows[4],
		oldY = anchor.getLocationRelativeTo().y
	const binding = bindChatReadingAnchor(content, viewport, () => following)
	content.rows.forEach((value: any) => (value.y += 192))
	content.rows.unshift(row(0), row(64), row(128))
	binding.update()
	expect(viewport.verticalOffset).toBe(492)
	expect(anchor.getLocationRelativeTo().y).toBe(oldY)
	content.rows.forEach((value: any) => (value.y += 50))
	binding.update()
	expect(anchor.getLocationRelativeTo().y).toBe(oldY)
	content.rows.push(row(3000))
	const before = viewport.verticalOffset
	binding.update()
	expect(viewport.verticalOffset).toBe(before)
	viewport.scrollToVerticalOffset(700)
	content.rows.forEach((value: any) => (value.y += 64))
	binding.update()
	expect(viewport.verticalOffset).toBe(764)
	following = true
	content.rows.forEach((value: any) => (value.y += 64))
	binding.update()
	expect(viewport.verticalOffset).toBe(764)
	binding()
	expect(readers.size).toBe(0)
})

it('uses supplied ids across object replacement and stable object identity for legacy data', () => {
	expect(chatMessageKey({ id: 'a' })).toBe(chatMessageKey({ id: 'a' }))
	const legacy = {}
	expect(chatMessageKey(legacy)).toBe(chatMessageKey(legacy))
	expect(chatMessageKey({})).not.toBe(chatMessageKey({}))
})

it('waits for descendant positions and ignores same-offset layout scroll notifications', () => {
	vi.useFakeTimers()
	const readers = new Set<() => void>()
	const viewport: any = {
		verticalOffset: 100,
		scrollableHeight: 1000,
		getActualSize: () => ({ height: 300 }),
		on(_name: string, cb: () => void) {
			readers.add(cb)
		},
		off(_name: string, cb: () => void) {
			readers.delete(cb)
		},
		scrollToVerticalOffset(value: number) {
			this.verticalOffset = value
			readers.forEach((cb) => cb())
		},
	}
	let layout = () => {}
	const content: any = {
		rows: [] as any[],
		getChildrenCount() {
			return this.rows.length
		},
		getChildAt(index: number) {
			return this.rows[index]
		},
		on(_name: string, cb: () => void) {
			layout = cb
		},
		off() {},
	}
	content.rows = Array.from({ length: 10 }, (_, i) => ({
		parent: content,
		y: i * 64,
		getActualSize: () => ({ height: 64 }),
		getLocationRelativeTo() {
			return { y: this.y - viewport.verticalOffset }
		},
	}))
	content.rows.forEach(markChatRow)
	const binding = bindChatReadingAnchor(content, viewport, () => false)
	const off = chatHost.observeLayout(content, binding.update, true)
	try {
		layout()
		content.rows.forEach((row: any) => {
			row.y += 128
		})

		readers.forEach((cb) => cb())
		vi.runAllTimers()
		expect(viewport.verticalOffset).toBe(228)
	} finally {
		off()
		binding()
		expect(vi.getTimerCount()).toBe(0)
		vi.useRealTimers()
	}
})

it('corrects range-driven top-offset drift without treating it as a manual scroll', () => {
	let offset = 100
	const viewport: any = {
		get verticalOffset() {
			return offset
		},
		scrollableHeight: 1000,
		getActualSize: () => ({ height: 300 }),
		on() {},
		off() {},
		scrollToVerticalOffset(value: number) {
			offset = value
		},
	}
	const content: any = { getChildrenCount: () => 1, getChildAt: () => row }
	const row: any = {
		parent: content,
		getActualSize: () => ({ height: 64 }),
		getLocationRelativeTo: () => ({ y: 120 - offset }),
	}
	markChatRow(row)
	const binding = bindChatReadingAnchor(content, viewport, () => false)
	// AppKit unflipped documents change normalized top offset when their range grows,
	// even if NSClipView's native origin did not move and no user scroll occurred.
	offset = 196
	binding.update()
	expect(offset).toBe(100)
	binding()
})
