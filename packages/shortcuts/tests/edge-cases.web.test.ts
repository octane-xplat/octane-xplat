import { createShortcuts } from '../src/index.web'

const press = (target: EventTarget, key: string, init: KeyboardEventInit = {}) => {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
	target.dispatchEvent(event)
	return event
}

it('matches explicit physical codes without falling back to the logical key', () => {
	const shortcuts = createShortcuts({ target: document })
	const call = vi.fn()
	shortcuts.bind('Ctrl+KeyQ', call)
	press(document, 'q', { code: 'KeyA', ctrlKey: true })
	expect(call).not.toHaveBeenCalled()
	press(document, 'a', { code: 'KeyQ', ctrlKey: true })
	expect(call).toHaveBeenCalledTimes(1)
	shortcuts.dispose()
})

it('matches punctuation and keypad codes', () => {
	const shortcuts = createShortcuts({ target: document })
	const call = vi.fn()
	shortcuts.bind('NumpadEnter', call)
	shortcuts.bind('Ctrl+slash', call)
	press(document, 'Enter', { code: 'NumpadEnter' })
	press(document, ':', { code: 'Slash', ctrlKey: true })
	expect(call).toHaveBeenCalledTimes(2)
	shortcuts.dispose()
})

it('keeps completed recording handles from stopping or cancelling a later recording', async () => {
	const shortcuts = createShortcuts({ target: document })
	const first = shortcuts.record()
	press(document, 'a')
	first.stop()
	const second = shortcuts.record()
	first.cancel()
	expect(first.stop().expression).toBe('a')
	press(document, '+', { shiftKey: true })
	expect(second.stop().expression).toBe('Shift+Plus')
	await expect(first.finished).resolves.toHaveProperty('expression', 'a')
	await expect(second.finished).resolves.toHaveProperty('expression', 'Shift+Plus')
	const call = vi.fn()
	shortcuts.bind('Shift+Plus', call)
	press(document, '+', { shiftKey: true })
	expect(call).toHaveBeenCalledTimes(1)
	shortcuts.dispose()
})

it('clears sequences after focus leaves the app', () => {
	const shortcuts = createShortcuts({ target: document })
	const call = vi.fn()
	shortcuts.bind({ sequence: 'g i', handler: call })
	press(document, 'g')
	window.dispatchEvent(new Event('blur'))
	press(document, 'i')
	expect(call).not.toHaveBeenCalled()
	shortcuts.dispose()
})

it('rejects unsafe context paths and applies batch updates atomically', () => {
	const shortcuts = createShortcuts({ target: document })
	shortcuts.setContext('editor.ready', true)
	expect(() =>
		shortcuts.batchContext({ 'editor.ready': false, '__proto__.poisoned': true }),
	).toThrow()
	expect(shortcuts.getContext('editor.ready')).toBe(true)
	expect(({} as Record<string, unknown>).poisoned).toBeUndefined()
	shortcuts.dispose()
})

it('accepts keyboard events from a different DOM realm', () => {
	const frame = document.createElement('iframe')
	document.body.append(frame)
	const owner = frame.contentDocument!
	const shortcuts = createShortcuts({ target: owner })
	const call = vi.fn()
	shortcuts.bind('Ctrl+k', call)
	const Keyboard = (frame.contentWindow as any).KeyboardEvent
	owner.dispatchEvent(new Keyboard('keydown', { key: 'k', ctrlKey: true, bubbles: true }))
	expect(call).toHaveBeenCalledTimes(1)
	shortcuts.dispose()
	frame.remove()
})

it('rejects unusable timeouts and unsupported hosts explicitly', async () => {
	expect(() => createShortcuts({ target: document, sequenceTimeout: NaN })).toThrow(
		'sequenceTimeout',
	)
	const { createShortcuts: unsupported } = await import('../src/index')
	expect(() => unsupported({ target: {} })).toThrow('host condition')
	const shortcuts = createShortcuts({ target: document, platform: 'mac' })
	expect(() => shortcuts.record({ timeout: 0 })).toThrow('timeout')
	const call = vi.fn()
	shortcuts.bind('Mod+k', call)
	press(document, 'k', { metaKey: true })
	expect(call).toHaveBeenCalledTimes(1)
	shortcuts.dispose()
})
