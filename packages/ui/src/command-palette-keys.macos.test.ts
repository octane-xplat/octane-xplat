import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindCommandPaletteKeys } from './command-palette-keys.macos'

afterEach(() => vi.unstubAllGlobals())
function host() {
	let monitor!: (event: any) => any
	let changed!: () => void
	const removed: unknown[] = []
	const editor = { hasMarkedText: false }
	const owner = { firstResponder: editor, makeFirstResponder: vi.fn() }
	const input = { window: owner, stringValue: 'new query', currentEditor: () => editor }
	vi.stubGlobal('NSEvent', {
		addLocalMonitorForEventsMatchingMaskHandler: (_: unknown, handler: typeof monitor) => {
			monitor = handler
			return 'monitor'
		},
		removeMonitor: (token: unknown) => removed.push(token),
	})

	vi.stubGlobal('NSNotificationCenter', {
		defaultCenter: {
			addObserverForNameObjectQueueUsingBlock: (
				_: unknown,
				field: unknown,
				queue: unknown,
				callback: () => void,
			) => {
				expect(field).toBe(input)
				expect(queue).toBeNull()
				changed = callback
				return 'observer'
			},
			removeObserver: (token: unknown) => removed.push(token),
		},
	})

	return {
		input,
		owner,
		editor,
		removed,
		key: (code: number, eventOwner = owner) => {
			const event = { keyCode: code, window: eventOwner }
			return monitor(event)
		},
		changed: () => changed(),
	}
}

describe('AppKit palette input adapter', () => {
	it('scopes hardware keys to the active editor and preserves IME composition', () => {
		const env = host()
		const keys: string[] = []
		const unbind = bindCommandPaletteKeys(
			env.input,
			(event) => {
				keys.push(event.key)
				event.preventDefault()
			},
			true,
			() => {},
		)

		expect(env.key(125)).toBeNull()
		expect(env.key(36)).toBeNull()
		expect(keys).toEqual(['ArrowDown', 'Enter'])
		env.editor.hasMarkedText = true
		expect(env.key(36)).not.toBeNull()
		env.editor.hasMarkedText = false
		expect(env.key(53, { ...env.owner })).not.toBeNull()
		expect(keys).toHaveLength(2)
		unbind()
		expect(env.removed).toEqual(['monitor', 'observer'])
	})

	it('routes text-change notifications to search and leaves ordinary keys alone', () => {
		const env = host()
		const queries: string[] = []
		const unbind = bindCommandPaletteKeys(
			env.input,
			() => {},
			false,
			(query) => queries.push(query),
		)

		env.changed()
		expect(queries).toEqual(['new query'])
		expect(env.key(0)).not.toBeNull()
		unbind()
	})
})
