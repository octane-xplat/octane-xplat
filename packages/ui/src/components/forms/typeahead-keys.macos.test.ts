import { expect, it } from 'vitest'
import { createAppKitTypeaheadKeys } from './typeahead-keys.macos'
function fixture() {
	const view: any = { window: null }, window: any = { firstResponder: view }; view.window = window
	let input: any = view, notify = (_: any) => {}
	const state = { open: true, blocked: false, query: '', entriesOnFocus: true, items: ['a', 'b', 'c'], active: 0 }, calls: any[] = []
	const handler = createAppKitTypeaheadKeys({ input: () => input, state: () => state, notify: (event) => notify(event),
		open() { state.open = true; calls.push('open') }, close() { state.open = false; calls.push('close') },
		highlight(index) { state.active = index; calls.push(index) }, select(item) { calls.push(item) },
	})
	const key = (key: string, extra: any = {}) => {
		const event = { key, target: view, currentTarget: view, code: '', defaultPrevented: false, stopped: false, isComposing: false, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, repeat: false,
			preventDefault() { this.defaultPrevented = true }, stopPropagation() { this.stopped = true }, ...extra }
		handler(event); return event
	}
	return { view, window, state, calls, handler, key, set input(value: any) { input = value }, set notify(value: (event: any) => void) { notify = value } }
}
it('wraps highlight and Home/End without changing first responder or selecting until Enter', () => {
	const f = fixture(); f.key('ArrowDown'); f.key('End'); f.key('ArrowDown'); f.key('ArrowUp'); f.key('Home'); expect(f.calls).toEqual([1, 2, 0, 2, 0])
	const event = f.key('Enter'); expect(f.calls.at(-1)).toBe('a'); expect(event.defaultPrevented).toBe(true); expect(event.stopped).toBe(true); expect(f.window.firstResponder).toBe(f.view)
})
it('closed ArrowDown opens only eligible results and preserves other closed-state editing keys', () => {
	const f = fixture(); f.state.open = false; f.state.entriesOnFocus = false
	for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', 'Escape']) expect(f.key(key).defaultPrevented).toBe(false)
	f.state.query = 'a'; expect(f.key('ArrowDown').defaultPrevented).toBe(true); expect(f.calls).toEqual(['open'])
})
it('Escape consumes only an open result list; Tab/Shift+Tab close without cancelling native traversal', () => {
	const f = fixture(); const escape = f.key('Escape'); expect(escape.defaultPrevented).toBe(true); expect(f.key('Escape').defaultPrevented).toBe(false)
	for (const shiftKey of [false, true]) { f.state.open = true; const tab = f.key('Tab', { shiftKey }); expect(tab.defaultPrevented).toBe(false); expect(tab.stopped).toBe(false); expect(f.state.open).toBe(false) }
	f.state.open = true; f.state.items = []; f.key('Enter'); expect(f.calls).toEqual(['close', 'close', 'close'])
})
it('composition, native marked editors, modified selection/shortcuts and ordinary editing retain defaults', () => {
	const f = fixture()
	for (const extra of [{ isComposing: true }, { altKey: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) expect(f.key('ArrowDown', extra).defaultPrevented).toBe(false)
	for (const key of [' ', 'Backspace', 'ArrowLeft', 'ArrowRight']) expect(f.key(key).defaultPrevented).toBe(false)
	const editor = { hasMarkedText: () => true }; f.view.currentEditor = () => editor; f.window.firstResponder = editor
	expect(f.key('Enter').defaultPrevented).toBe(false); editor.hasMarkedText = () => false; f.key('ArrowDown'); expect(f.calls).toEqual([1])
})
it('consumer cancellation and current state changes precede internal intent; recursive dispatch is ignored', () => {
	const f = fixture(); f.notify = (event) => event.preventDefault(); f.key('ArrowDown'); expect(f.calls).toEqual([])
	f.notify = () => { f.state.items = ['current']; f.state.active = 0 }; f.key('Enter'); expect(f.calls).toEqual(['current'])
	f.notify = () => { f.state.blocked = true }; f.key('ArrowDown'); expect(f.calls).toEqual(['current'])
	f.state.blocked = false; f.state.items = ['a', 'b', 'c']; let notifications = 0
	f.notify = () => { notifications++; f.key('ArrowDown') }; f.key('ArrowDown', { repeat: true }); expect(notifications).toBe(1); expect(f.calls.at(-1)).toBe(1)
})
it('foreign targets, detached/hidden/replaced inputs and transferred responders cannot dispatch retained handlers', () => {
	for (const reason of ['target', 'currentTarget', 'detach', 'hidden', 'replace', 'focus']) {
		const f = fixture(), extra: any = {}
		if (reason === 'target') extra.target = {}
		if (reason === 'currentTarget') extra.currentTarget = {}
		if (reason === 'detach') f.view.window = null
		if (reason === 'hidden') f.view.hiddenOrHasHiddenAncestor = () => true
		if (reason === 'replace') f.input = {}
		if (reason === 'focus') f.window.firstResponder = {}
		f.key('ArrowDown', extra); expect(f.calls).toEqual([])
	}
})
it('revalidates attachment/focus after consumer code and releases its reentry claim on errors', () => {
	const f = fixture(); f.notify = () => { f.window.firstResponder = {} }; f.key('Enter'); expect(f.calls).toEqual([])
	f.window.firstResponder = f.view; f.notify = () => { throw Error('consumer') }; expect(() => f.key('Enter')).toThrow('consumer')
	f.notify = () => {}; f.key('Enter'); expect(f.calls).toEqual(['a'])
	const editor = {}; f.view.currentEditor = editor; f.window.firstResponder = editor; f.key('End'); expect(f.calls.at(-1)).toBe(2)
})
