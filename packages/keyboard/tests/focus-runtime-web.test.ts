import { expect, it, vi } from 'vitest'
vi.mock('../src/focus-source', async () => await import('../src/focus-source.web'))
import { focusRuntime } from '../src/focus-runtime.web'
import { focusRechecks } from '../src/focus-source.web'
import { focusWebFixture as fixture } from './helpers/focus-web'

it('shares one window source and releases detached hosts and stale lifecycle callbacks', () => {
	const f = fixture(),
		first: any[] = [],
		second: any[] = []
	const deactivate = focusRuntime.activate()
	const a = focusRuntime.subscribe(f.root, (value) => first.push(value))
	const b = focusRuntime.subscribe(f.scroll, (value) => second.push(value))
	expect(f.queue.size).toBe(1)
	expect(first[0]).toBe(second[0])
	expect(focusRuntime.getSnapshot(f.root)).toBe(first[0])
	f.field.selectionEnd = 4
	focusRuntime.recheck(f.root)
	expect(first.at(-1)).toBe(second.at(-1))
	expect(first.at(-1).selection.end).toBe(4)
	f.root.isConnected = f.scroll.isConnected = false
	f.watchers.forEach((observer: any) => observer.callback())
	expect(first.at(-1).input).toBeNull()
	expect(second.at(-1).input).toBeNull()
	expect(f.queue.size).toBe(0)
	f.root.isConnected = f.scroll.isConnected = true
	f.watchers.forEach((observer: any) => observer.callback())
	expect(f.queue.size).toBe(1)
	a()
	b()
	deactivate()
	f.watchers.forEach((observer: any) => observer.callback())
	expect(f.queue.size).toBe(0)
	expect(focusRechecks.has(f.document)).toBe(false)
	expect(f.watchers.every((observer: any) => observer.disconnected)).toBe(true)
})

it('moves observation to the host document and releases the old window', () => {
	const first = fixture(),
		next = fixture(),
		snapshots: any[] = []
	const deactivate = focusRuntime.activate()
	const off = focusRuntime.subscribe(first.root, (value) => snapshots.push(value))
	first.root.ownerDocument = next.document
	first.watchers[0].callback()
	expect(first.queue.size).toBe(0)
	expect(next.queue.size).toBe(1)
	expect(snapshots.at(-1).input).toBe(next.field)
	expect(focusRuntime.getSnapshot(first.root)).toBe(snapshots.at(-1))
	off()
	deactivate()
	expect(next.queue.size).toBe(0)
})

it('rolls back a failed initial subscriber without retaining a source or host observer', () => {
	const f = fixture(),
		deactivate = focusRuntime.activate()
	expect(() =>
		focusRuntime.subscribe(f.root, () => {
			throw new Error('reader failed')
		}),
	).toThrow()
	expect(f.queue.size).toBe(0)
	expect(f.watchers.every((observer: any) => observer.disconnected)).toBe(true)
	expect(focusRechecks.has(f.document)).toBe(false)
	deactivate()
})

it('invalidates a suspended window before notifying any of its readers and resumes it once', () => {
	const f = fixture(),
		values: any[] = [],
		cached: any[] = []
	const deactivate = focusRuntime.activate()
	const a = focusRuntime.subscribe(f.root, (value) => {
		values.push(value)
		cached.push(focusRuntime.getSnapshot(f.root))
	})
	const b = focusRuntime.subscribe(f.scroll, () => {})
	f.dispatch('pagehide')
	expect(values.at(-1).capabilities.inputBounds).toBe(false)
	expect(cached.at(-1)).toBe(values.at(-1))
	expect(f.queue.size).toBe(0)
	f.dispatch('pageshow')
	expect(values.at(-1).input).toBe(f.field)
	expect(f.queue.size).toBe(1)
	a()
	b()
	deactivate()
	expect([...f.events.values()].every((listeners) => listeners.size === 0)).toBe(true)
})

it('scopes navigation by document even when the WindowProxy identity is reused', () => {
	const first = fixture(),
		next = fixture(),
		deactivate = focusRuntime.activate()
	const before: any[] = [],
		after: any[] = []
	const oldOff = focusRuntime.subscribe(first.root, (value) => before.push(value))
	// A navigation replaces the global/document behind the same WindowProxy.
	const proxy = first.window
	proxy.document = next.document
	proxy.requestAnimationFrame = next.window.requestAnimationFrame
	proxy.cancelAnimationFrame = next.window.cancelAnimationFrame
	next.document.defaultView = proxy
	const newOff = focusRuntime.subscribe(next.root, (value) => after.push(value))
	expect(after.at(-1).input).toBe(next.field)
	first.watchers[0].callback()
	expect(before.at(-1).capabilities.inputBounds).toBe(false)
	expect(focusRuntime.getSnapshot(first.root).input).toBeNull()
	expect(next.queue.size).toBe(1)
	oldOff()
	newOff()
	deactivate()
	expect(next.queue.size).toBe(0)
})
