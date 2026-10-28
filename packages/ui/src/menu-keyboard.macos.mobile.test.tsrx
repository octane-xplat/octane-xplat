import { expect, it } from 'vitest'
import { createAppKitMenuKeyboard } from './menu-keyboard.macos'

function fixture() {
	const state = { focused: undefined as string | undefined, direction: 'ltr' as 'ltr' | 'rtl', time: 1000, allowFocus: true }
	const rows = [{ key: 'a', label: 'Alpha', submenu: false }, { key: 'b', label: 'Apricot', submenu: true }, { key: 'c', label: 'Cedar', submenu: false }]
	const picks: string[] = [], opened: string[] = [], moved: string[] = []
	let closed = 0, levels = 0
	const keyboard = createAppKitMenuKeyboard({
		rows: () => rows, focused: () => state.focused, direction: () => state.direction,
		focus: (key) => { if (!state.allowFocus) return false; moved.push(key); state.focused = key; return true },
		press: (key) => picks.push(key), openSubmenu: (key) => opened.push(key),
		closeMenu: () => { closed++ }, closeLevel: () => { levels++ },
	}, () => state.time)
	const key = (name: string, extra = {}) => {
		const event = { key: name, code: '', altKey: false, ctrlKey: false, metaKey: false, shiftKey: false,
			isComposing: false, repeat: false, defaultPrevented: false, stopped: false,
			preventDefault() { this.defaultPrevented = true }, stopPropagation() { this.stopped = true }, ...extra }
		keyboard.keyDown(event); return event
	}
	return { state, rows, picks, opened, moved, key, keyboard, get closed() { return closed }, get levels() { return levels } }
}

it('menu arrows wrap, edges move focus and activation remains manual', () => {
	const f = fixture()
	expect(f.key('ArrowDown').defaultPrevented).toBe(true); expect(f.state.focused).toBe('a')
	f.key('ArrowUp'); expect(f.state.focused).toBe('c')
	f.key('ArrowDown'); expect(f.state.focused).toBe('a')
	f.key('End'); expect(f.state.focused).toBe('c')
	f.key('Home'); expect(f.state.focused).toBe('a'); expect(f.picks).toEqual([])
	f.key('Enter'); f.key(' '); expect(f.picks).toEqual(['a', 'a'])
})

it('directional submenu opening and parent closing follow RTL without activating ordinary rows', () => {
	const f = fixture(); f.state.focused = 'a'
	expect(f.key('ArrowRight').defaultPrevented).toBe(false)
	f.state.focused = 'b'; expect(f.key('ArrowRight').stopped).toBe(true); expect(f.opened).toEqual(['b'])
	f.key('ArrowLeft'); expect(f.levels).toBe(1)
	f.state.direction = 'rtl'; f.key('ArrowLeft'); expect(f.opened).toEqual(['b', 'b'])
	f.key('ArrowRight'); expect(f.levels).toBe(2)
	expect(f.picks).toEqual([])
})

it('prefix search and repeated characters cycle labels and expire without choosing rows', () => {
	const f = fixture(); f.state.focused = 'a'
	f.key('a'); expect(f.state.focused).toBe('b')
	f.key('a'); expect(f.state.focused).toBe('a')
	f.state.time += 501; f.key('a'); f.key('p'); expect(f.state.focused).toBe('b')
	f.keyboard.reset(); f.key('c'); expect(f.state.focused).toBe('c')
	expect(f.picks).toEqual([])
	expect(f.key('z').defaultPrevented).toBe(false)
})

it('Tab requests close without trapping native movement; Escape stays with layer dismissal', () => {
	const f = fixture()
	expect(f.key('Tab').defaultPrevented).toBe(false)
	expect(f.key('Tab', { shiftKey: true }).stopped).toBe(false)
	expect(f.closed).toBe(2)
	expect(f.key('Escape').defaultPrevented).toBe(false)
	expect(f.levels).toBe(0)
})

it('composition/prevented/modified events and unsuccessful or empty focus moves stay unconsumed', () => {
	const f = fixture(); f.state.focused = 'b'
	for (const flag of ['isComposing', 'altKey', 'ctrlKey', 'metaKey', 'defaultPrevented']) {
		for (const name of ['ArrowDown', 'Enter', 'ArrowRight', 'ArrowLeft', 'a', 'Tab']) {
			const event = f.key(name, { [flag]: true }); expect(event.stopped).toBe(false)
		}
	}
	expect(f.picks).toEqual([]); expect(f.opened).toEqual([]); expect(f.closed).toBe(0); expect(f.levels).toBe(0)
	f.state.allowFocus = false; expect(f.key('Home').defaultPrevented).toBe(false)
	f.rows.length = 0
	for (const name of ['ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' ']) expect(f.key(name).defaultPrevented).toBe(false)
})
