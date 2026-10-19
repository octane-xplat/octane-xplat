import { afterEach, expect, it, vi } from 'vitest'
import { leaseKeyboardViewport } from '../src/viewport.android'

const bars = { left: 0, top: 24, right: 0, bottom: 24 }
const zero = { left: 0, top: 0, right: 0, bottom: 0 }
function native(base = [2, 4, 6, 8]) {
	return {
		base: [...base],
		padding: [...base],
		edges: { ...zero },
		ime: { ...zero },
		getPaddingLeft() {
			return this.padding[0]
		},
		getPaddingTop() {
			return this.padding[1]
		},
		getPaddingRight() {
			return this.padding[2]
		},
		getPaddingBottom() {
			return this.padding[3]
		},
		getEdgeInsets() {
			return this.edges
		},
		getImeInsets() {
			return this.ime
		},
		apply() {
			this.padding = this.base.map(
				(value, index) =>
					value +
					[
						this.edges.left,
						this.edges.top,
						this.edges.right,
						Math.max(this.edges.bottom, this.ime.bottom),
					][index],
			)
		},
		setPadding(...values: number[]) {
			this.base = values
			this.apply()
		},
	}
}

function fixture() {
	const listeners = new Set<(event: any) => void>()
	let policy = 'none'
	const initial = native()
	initial.edges = { ...bars }
	initial.apply()
	const page: any = {
		android: initial,
		parent: null,
		on(_event: string, listener: any) {
			listeners.add(listener)
		},
		off(_event: string, listener: any) {
			listeners.delete(listener)
		},
		hasListeners() {
			return listeners.size > 0
		},
	}
	Object.defineProperty(page, 'androidOverflowEdge', {
		get: () => policy,
		set(value: string) {
			policy = value
			page.android.edges = value === 'none' ? { ...bars } : { ...zero }
			page.android.ime = { ...zero }
			page.android.apply()
		},
	})
	let last: any
	const request = () => {
		if (policy === 'dont-apply') {
			last = { ...bars, imeBottom: 259 }
			listeners.forEach((listener) => listener({ inset: last }))
		}
	}
	vi.stubGlobal('androidx', {
		core: {
			view: {
				ViewCompat: {
					requestApplyInsets: request,
					getRootWindowInsets: () => ({ getInsets: () => bars }),
				},
				WindowInsetsCompat: { Type: { systemBars: () => 1 } },
			},
		},
	})
	return { page, host: { parent: page, page }, listeners, request, last: () => last }
}

afterEach(() => vi.unstubAllGlobals())

it('shares an inset policy, preserves system bars and restores only after the final consumer', () => {
	const f = fixture(),
		first = leaseKeyboardViewport(f.host),
		second = leaseKeyboardViewport(f.host)
	expect(first.supported).toBe(true)
	expect(f.page.androidOverflowEdge).toBe('dont-apply')
	expect(f.page.android.padding).toEqual([2, 28, 6, 32])
	expect(f.last().imeBottom).toBe(0)
	expect(f.last().imeBottomConsumed).toBe(true)
	expect(f.listeners.size).toBe(1)
	first.release()
	first.release()
	expect(f.page.androidOverflowEdge).toBe('dont-apply')
	second.release()
	expect(f.page.androidOverflowEdge).toBe('none')
	expect(f.page.android.padding).toEqual([2, 28, 6, 32])
	expect(f.listeners.size).toBe(0)
})

it('preserves a newer foreign padding baseline', () => {
	const f = fixture(),
		lease = leaseKeyboardViewport(f.host)
	f.page.android.setPadding(2, 50, 6, 32)
	f.request()
	expect(f.page.android.padding[1]).toBe(74)
	lease.release()
	expect(f.page.android.base[1]).toBe(50)
	expect(f.page.android.padding[1]).toBe(74)
})

it('unbakes owned bar padding without undoing a newer overflow policy', () => {
	const f = fixture(),
		lease = leaseKeyboardViewport(f.host)
	f.page.androidOverflowEdge = 'ignore'
	expect(lease.supported).toBe(false)
	lease.release()
	expect(f.page.androidOverflowEdge).toBe('ignore')
	expect(f.page.android.padding).toEqual([2, 4, 6, 8])
})

it('does not double bar padding if a foreign owner restores automatic insets first', () => {
	const f = fixture(),
		lease = leaseKeyboardViewport(f.host)
	f.page.androidOverflowEdge = 'none'
	lease.release()
	expect(f.page.androidOverflowEdge).toBe('none')
	expect(f.page.android.padding).toEqual([2, 28, 6, 32])
})

it('captures fresh base padding after native view replacement', () => {
	const f = fixture(),
		lease = leaseKeyboardViewport(f.host)
	const detached = f.page.android
	f.page.android = native([1, 3, 5, 7])
	expect(lease.supported).toBe(false)
	lease.update()
	expect(detached.padding).toEqual([2, 4, 6, 8])
	expect(lease.supported).toBe(true)
	expect(f.page.android.padding).toEqual([1, 27, 5, 31])
	lease.release()
	expect(f.page.androidOverflowEdge).toBe('none')
	expect(f.page.android.padding).toEqual([1, 27, 5, 31])
})

it('leaves an existing foreign inset distributor in control', () => {
	const f = fixture(),
		foreign = () => {}
	f.page.on('androidOverflowInset', foreign)
	const lease = leaseKeyboardViewport(f.host)
	expect(lease.supported).toBe(false)
	expect(f.page.androidOverflowEdge).toBe('none')
	lease.release()
	expect(f.listeners.size).toBe(1)
})
