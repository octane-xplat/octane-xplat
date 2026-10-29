import { expect, it } from 'vitest'
import { createAppKitColumnResizeState, type AppKitResizeScope } from './column-resize-state.macos'
import type { UseTableColumnResizeConfig } from './use-table-column-resize.tsrx'
const scope = (extra: Partial<AppKitResizeScope> = {}): AppKitResizeScope => ({ key: 'name', view: {}, width: 180, direction: 'ltr', valid: () => true, ...extra })
it('uncontrolled drags preview cumulative translation, clamp and commit once with persistent widths', () => {
	const commits: Record<string, number>[] = []
	const state = createAppKitColumnResizeState({ config: () => ({ minWidth: 100, maxWidth: 300, onColumnResizeEnd: (value) => commits.push(value) }), changed() {} }), owner = scope()
	state.begin(owner); state.move(owner, 50); expect(state.widths()).toEqual({ name: 230 })
	state.move(owner, 90); expect(state.widths()).toEqual({ name: 270 })
	state.end(owner, 500); expect(state.widths()).toEqual({ name: 300 }); expect(commits).toEqual([{ name: 300 }])
	state.end(owner, 600); expect(commits).toHaveLength(1)
	const fractional = createAppKitColumnResizeState({ config: () => ({ minWidth: 80.5, maxWidth: 300.5 }), changed() {} }), fine = scope({ width: 180.25 })
	fractional.begin(fine); fractional.end(fine, 0); expect(fractional.widths()).toEqual({})
	fractional.key(fine, 'End'); expect(fractional.widths().name).toBe(300.5)
})
it('controlled commits return to parent state unless acknowledged; programmatic values do not echo', () => {
	const commits: Record<string, number>[] = []
	let config: UseTableColumnResizeConfig = { columnWidths: { name: 200, status: 140 }, onColumnResizeEnd: (value) => commits.push(value) }
	const state = createAppKitColumnResizeState({ config: () => config, changed() {} }), owner = scope()
	state.begin(owner); state.move(owner, 40); expect(state.widths().name).toBe(240)
	state.end(owner, 40); expect(commits).toEqual([{ name: 240, status: 140 }]); expect(state.widths().name).toBe(200)
	config = { ...config, columnWidths: commits[0] }; expect(state.widths().name).toBe(240); expect(commits).toHaveLength(1)
})
it('parent feedback during a drag can acknowledge requests but unrelated active-column updates retire the preview', () => {
	let config: UseTableColumnResizeConfig = { columnWidths: { name: 200 } }, commits = 0
	config.onColumnResizeEnd = () => commits++
	const state = createAppKitColumnResizeState({ config: () => config, changed() {} }), owner = scope()
	state.begin(owner); state.move(owner, 20)
	config = { ...config, columnWidths: { name: 220 } }; expect(state.widths().name).toBe(220)
	state.move(owner, 40); expect(state.widths().name).toBe(240)
	config = { ...config, columnWidths: { name: 350 } }; expect(state.widths().name).toBe(350)
	expect(state.end(owner, 100)).toBe(false); expect(commits).toBe(0)
})
it('cancellation, invalid handle scope, changed limits and disposal discard previews without commits', () => {
	let valid = true, commits = 0, config: UseTableColumnResizeConfig = { onColumnResizeEnd: () => commits++ }
	const state = createAppKitColumnResizeState({ config: () => config, changed() {} }), owner = scope({ valid: () => valid })
	state.begin(owner); state.move(owner, 30); state.cancel(owner.view); expect(state.widths()).toEqual({})
	state.begin(owner); state.move(owner, 20); valid = false; expect(state.end(owner, 40)).toBe(false)
	valid = true; state.begin(owner); config = { ...config, minWidth: 200 }; expect(state.end(owner, 40)).toBe(false)
	state.begin(owner); state.move(owner, 30); state.dispose(); expect(state.end(owner, 40)).toBe(false); expect(commits).toBe(0)
})
it('RTL mirrors physical drag/arrows; keyboard limits and AX increments use the latest committed width', () => {
	const state = createAppKitColumnResizeState({ config: () => ({ minWidth: 80, maxWidth: 400 }), changed() {} }), owner = scope({ direction: 'rtl' })
	state.begin(owner); state.end(owner, 20); expect(state.widths().name).toBe(160)
	state.key(owner, 'ArrowLeft'); expect(state.widths().name).toBe(170)
	state.key(owner, 'ArrowRight'); expect(state.widths().name).toBe(160)
	state.step(owner, 10); expect(state.widths().name).toBe(170)
	state.key(owner, 'Home'); expect(state.widths().name).toBe(80)
	state.key(owner, 'End'); expect(state.widths().name).toBe(400)
	expect(state.key(owner, 'ArrowUp')).toBe(false)
})
it('callbacks may throw or start a new gesture without reviving or retiring the old owner', () => {
	const first = scope(), second = scope({ key: 'team' })
	let commits = 0
	const state = createAppKitColumnResizeState({ config: () => ({ onColumnResizeEnd: () => { commits++; state.begin(second); throw Error('app callback') } }), changed() {} })
	state.begin(first)
	expect(() => state.end(first, 20)).toThrow('app callback')
	expect(state.active('team')).toBe(true); expect(state.end(first, 30)).toBe(false); expect(commits).toBe(1)
	state.cancel(second.view); expect(state.widths().name).toBe(200)
})
