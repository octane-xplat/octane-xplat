import { expect, it } from 'vitest'
import { createAppKitPagerState, type AppKitPagerFrame } from './pager-state.macos'
function fixture(extra: { page?: number; defaultPage?: number } = {}) {
	let source = { count: 4, direction: 'ltr' as 'ltr' | 'rtl', ...extra }
	let frame: AppKitPagerFrame | null = { view: {}, window: {}, width: 100, height: 80, position: 0, ready: true }
	let busy = false, immediate = true, report = (_: number) => {}
	const writes: { offset: number; animated: boolean }[] = [], changes: number[] = []
	const state = createAppKitPagerState({ source: () => source, frame: () => frame, busy: () => busy, beforeWrite() {},
		write(offset, animated) { writes.push({ offset, animated }); if (immediate && frame) frame = { ...frame, position: offset } },
		report(page) { changes.push(page); report(page) },
	})
	return { state, writes, changes, get source() { return source }, set source(value) { source = value }, get frame() { return frame }, set frame(value) { frame = value },
		set busy(value: boolean) { busy = value }, set immediate(value: boolean) { immediate = value }, set report(value: (page: number) => void) { report = value } }
}
it('seeds defaults once, clamps live bounds and never echoes programmatic writes', () => {
	const f = fixture({ defaultPage: 2 }); f.state.synchronize(); expect(f.writes).toEqual([{ offset: 200, animated: false }])
	f.source = { ...f.source, defaultPage: 0 }; f.state.synchronize(); expect(f.state.selected()).toBe(2)
	f.source = { ...f.source, page: 1 }; f.state.synchronize(); expect(f.writes.at(-1)).toEqual({ offset: 100, animated: true }); expect(f.changes).toEqual([])
	f.source = { ...f.source, page: 99, count: 2 }; f.state.synchronize(); expect(f.state.selected()).toBe(1); expect(f.changes).toEqual([])
})
it('reports only after the snapped native position arrives and claims before reentry', () => {
	const f = fixture(); f.state.synchronize(); f.immediate = false
	f.frame = { ...f.frame!, position: 170 }; f.state.interacted(); f.state.settle(); expect(f.changes).toEqual([])
	f.report = () => f.state.synchronize()
	f.frame = { ...f.frame!, position: 200 }; f.state.synchronize(); f.state.synchronize()
	expect(f.changes).toEqual([2]); expect(f.state.selected()).toBe(2)
})
it('accepted controlled echoes do not move again; rejected changes restore the parent page', () => {
	for (const accept of [false, true]) {
		const f = fixture({ page: 0 }); f.state.synchronize(); f.frame = { ...f.frame!, position: 200 }; f.state.interacted()
		f.report = (page) => { if (accept) f.source = { ...f.source, page }; f.state.synchronize() }
		f.state.settle(); expect(f.changes).toEqual([2]); expect(f.frame!.position).toBe(accept ? 200 : 0)
		expect(f.writes).toHaveLength(accept ? 0 : 1)
	}
})
it('current parent requests and moved windows cancel pending animated user reports', () => {
	const f = fixture({ page: 0 }); f.state.synchronize(); f.immediate = false; f.frame = { ...f.frame!, position: 170 }; f.state.interacted(); f.state.settle()
	f.source = { ...f.source, page: 3 }; f.state.synchronize(); f.frame = { ...f.frame!, position: 200 }; f.state.synchronize(); expect(f.changes).toEqual([])
	f.frame = { ...f.frame!, position: 150 }; f.state.interacted(); f.state.settle()
	f.frame = { ...f.frame!, window: {}, position: 200 }; f.state.synchronize(); expect(f.changes).toEqual([])
})
it('resize, direction and refill apply the current page without user callbacks', () => {
	const f = fixture({ defaultPage: 2 }); f.state.synchronize()
	f.frame = { ...f.frame!, width: 150 }; f.state.synchronize(); expect(f.frame!.position).toBe(300)
	f.source = { ...f.source, direction: 'rtl' }; f.frame = { ...f.frame!, position: 0 }; f.state.synchronize(); expect(f.frame!.position).toBe(300)
	f.source = { ...f.source, count: 0 }; f.state.detach(); f.state.synchronize()
	f.source = { ...f.source, count: 4, defaultPage: 0 }; f.state.synchronize(); expect(f.state.selected()).toBe(2); expect(f.changes).toEqual([])
})
it('does not let deferred default placement override an active first gesture', () => {
	const f = fixture({ defaultPage: 3 }); f.busy = true; f.state.synchronize(); expect(f.writes).toEqual([])
	f.frame = { ...f.frame!, position: 100 }; f.state.interacted(); f.state.synchronize(); expect(f.writes).toEqual([])
	f.busy = false; f.state.settle(); expect(f.changes).toEqual([1]); expect(f.state.selected()).toBe(1)
})
