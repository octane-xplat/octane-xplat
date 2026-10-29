import { expect, it } from 'vitest'
import { createAppKitSelectKeyboard } from './select-keyboard.macos'

function fixture() {
	const state = { open: false, blocked: false, pending: false, multiple: false, searchable: false,
		hasClear: true, hasSelectAll: true, editing: false, focused: undefined as string | undefined, selected: ['a'], time: 1000 }
	const options = [{ value: 'a', label: 'Alpha' }, { value: 'ap', label: 'Apricot' }, { value: 'c', label: 'Cedar' }]
	const opened: unknown[] = [], closed: string[] = [], picks: string[] = [], focused: string[] = [], queries: string[] = []
	let clears = 0, bulk = 0, searchFocus = 0
	const controller = createAppKitSelectKeyboard({
		open: () => state.open, blocked: () => state.blocked, pending: () => state.pending,
		multiple: () => state.multiple, searchable: () => state.searchable, hasClear: () => state.hasClear,
		hasSelectAll: () => state.hasSelectAll, enabled: () => options, selected: () => state.selected,
		focused: () => state.focused, editing: () => state.editing,
		focus: (value) => { focused.push(value); state.focused = value; return true },
		requestOpen: (edge, value) => { opened.push([edge, value]); state.open = true },
		close: (target) => { closed.push(target); state.open = false },
		query: (value) => queries.push(value), focusSearch: () => { searchFocus++ },
		pick: (option) => picks.push(option.value), clear: () => { clears++ }, selectAll: () => { bulk++ },
	}, () => state.time)
	const key = (name: string, extra = {}) => {
		const event: any = { key: name, code: '', altKey: false, ctrlKey: false, metaKey: false, shiftKey: false,
			repeat: false, isComposing: false, defaultPrevented: false, stopped: false,
			preventDefault() { this.defaultPrevented = true }, stopPropagation() { this.stopped = true }, ...extra }
		controller.keyDown(event)
		return event
	}
	return { state, options, controller, key, opened, closed, picks, focused, queries,
		get clears() { return clears }, get bulk() { return bulk }, get searchFocus() { return searchFocus } }
}

it('requests initial edges and moves manual focus with arrows/Home/End/Page keys without choosing', () => {
	const f = fixture()
	expect(f.key('ArrowDown').defaultPrevented).toBe(true)
	expect(f.opened).toEqual([['first', undefined]])
	f.state.open = false; f.key('ArrowUp')
	expect(f.opened.at(-1)).toEqual(['last', undefined])
	f.state.focused = 'a'; f.key('ArrowDown')
	expect(f.state.focused).toBe('ap')
	f.key('End'); expect(f.state.focused).toBe('c')
	f.key('ArrowDown'); expect(f.state.focused).toBe('c')
	f.key('Home'); expect(f.state.focused).toBe('a')
	f.key('ArrowUp'); expect(f.state.focused).toBe('a')
	f.key('PageDown'); expect(f.state.focused).toBe('c')
	f.key('PageUp'); expect(f.state.focused).toBe('a')
	expect(f.picks).toEqual([])
})

it('commits Enter/Space, blocks pending commits and preserves search caret/space keys', () => {
	const f = fixture()
	f.key('Enter'); expect(f.state.open).toBe(true)
	f.state.focused = 'c'; f.key('Enter'); f.key(' ')
	expect(f.picks).toEqual(['c', 'c'])
	f.state.pending = true; f.key('Enter'); expect(f.picks).toHaveLength(2)
	f.state.editing = true
	expect(f.key(' ').defaultPrevented).toBe(false)
	expect(f.key('Home').defaultPrevented).toBe(false)
	expect(f.key('End').defaultPrevented).toBe(false)
	f.state.pending = false; f.state.focused = undefined
	f.key('ArrowDown'); expect(f.state.focused).toBe('a')
})

it('preserves composition/modified/owned keys and closes Escape/Tab with explicit focus intents', () => {
	const f = fixture(); f.state.open = true
	expect(f.key('Escape', { isComposing: true }).defaultPrevented).toBe(false)
	f.key('ArrowDown', { altKey: true }); f.key('ArrowDown', { ctrlKey: true }); f.key('ArrowDown', { defaultPrevented: true })
	expect(f.focused).toEqual([])
	const escape = f.key('Escape')
	expect(escape.stopped).toBe(true); expect(f.closed).toEqual(['anchor'])
	f.state.open = true; f.key('Tab'); expect(f.closed.at(-1)).toBe('next')
	f.state.open = true; f.key('Tab', { shiftKey: true }); expect(f.closed.at(-1)).toBe('previous')
	f.state.blocked = true; expect(f.key('Enter').defaultPrevented).toBe(false)
})

it('cycles repeated prefixes, resets after timeout and chooses closed single values without opening', () => {
	const f = fixture()
	f.key('a'); expect(f.picks).toEqual(['ap'])
	f.state.open = true; f.state.focused = 'a'; f.controller.reset()
	f.key('a'); expect(f.state.focused).toBe('ap')
	f.key('a'); expect(f.state.focused).toBe('a')
	f.state.time += 600; f.key('c'); expect(f.state.focused).toBe('c')
	f.state.time += 600; f.key('a'); f.key('p'); expect(f.state.focused).toBe('ap')
	f.state.open = false; f.state.multiple = true; f.state.focused = undefined; f.controller.reset(); f.key('a')
	expect(f.opened.at(-1)).toEqual(['first', 'ap'])
})

it('starts local search outside the editor and leaves actual editor typing native', () => {
	const f = fixture(); f.state.searchable = true
	f.key('x'); expect(f.queries).toEqual(['x']); expect(f.state.open).toBe(true)
	f.key('y'); expect(f.queries).toEqual(['x', 'y']); expect(f.searchFocus).toBe(1)
	f.state.editing = true
	expect(f.key('z').defaultPrevented).toBe(false)
	expect(f.queries).toEqual(['x', 'y'])
})

it('bulk shortcuts belong to nonediting multi-select and closed clear respects pending/shortcuts', () => {
	const f = fixture(); f.state.open = true; f.state.multiple = true
	f.key('a', { metaKey: true }); expect(f.bulk).toBe(1)
	f.state.editing = true; expect(f.key('a', { metaKey: true }).defaultPrevented).toBe(false)
	f.state.editing = false; f.state.pending = true; f.key('a', { ctrlKey: true }); expect(f.bulk).toBe(1)
	f.state.open = false; f.key('Backspace'); expect(f.clears).toBe(0)
	f.state.pending = false; f.key('Delete'); expect(f.clears).toBe(1)
	f.key('Delete', { metaKey: true }); expect(f.clears).toBe(1)
})
