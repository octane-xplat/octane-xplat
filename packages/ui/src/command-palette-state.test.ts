import { describe, expect, it } from 'vitest'
import type { CommandPaletteItem, CommandPaletteProps } from './props'
import { createCommandPaletteController, staticCommands } from './command-palette-state'

const items = [
	{ key: 'off', label: 'Disabled', disabled: true, group: 'Actions' },
	{ key: 'settings', label: 'Settings', group: 'Navigation', keywords: ['preferences'] },
	{ key: 'new', label: 'New project', group: 'Actions' },
]

const deferred = () => {
	let resolve!: (items: CommandPaletteItem[]) => void
	let reject!: (error: Error) => void
	const promise = new Promise<CommandPaletteItem[]>((yes, no) => {
		resolve = yes
		reject = no
	})

	return { promise, resolve, reject }
}

const tick = async () => {
	await Promise.resolve()
	await Promise.resolve()
}

function setup(extra: Partial<CommandPaletteProps> = {}) {
	const props: CommandPaletteProps = { open: true, items, ...extra }
	const controller = createCommandPaletteController(() => props)
	controller.configure()
	return { props, controller }
}

function key(
	controller: ReturnType<typeof createCommandPaletteController>,
	name: string,
	composing = false,
) {
	let prevented = false
	controller.keyDown({
		key: name,
		isComposing: composing,
		preventDefault: () => {
			prevented = true
		},
	})

	return prevented
}

describe('CommandPalette search and selection', () => {
	it('normalizes static queries, matches aliases, and ranks fuzzy matches deterministically', () => {
		expect(staticCommands({ items }, ' PREF ')).toMatchObject([{ id: 'settings' }])
		expect(staticCommands({ items, searchMode: 'fuzzy' }, 'nwprj')).toMatchObject([{ id: 'new' }])
		expect(
			staticCommands(
				{
					items: [
						{ key: 'b', label: 'Settings page' },
						{ key: 'a', label: 'Settings' },
					],
					searchMode: 'fuzzy',
				},
				'settings',
			).map((item) => item.id),
		).toEqual(['a', 'b'])

		expect(staticCommands({ items: [{ key: 'visible-key' }] }, '')[0].label).toBe('visible-key')
	})

	it('uses grouped display order for keyboard navigation and skips disabled commands', () => {
		const { controller } = setup()
		expect(controller.store.get().results.map((item) => item.id)).toEqual([
			'off',
			'new',
			'settings',
		])

		key(controller, 'ArrowDown')
		expect(controller.store.get().highlighted).toBe('new')
		key(controller, 'PageDown')
		expect(controller.store.get().highlighted).toBe('settings')
		key(controller, 'ArrowDown')
		expect(controller.store.get().highlighted).toBe('settings')
		key(controller, 'PageUp')
		expect(controller.store.get().highlighted).toBe('new')
	})

	it('does not execute without a highlight, on a disabled item, or during composition', () => {
		const events: string[] = []
		const { controller } = setup({ onValueChange: (id) => events.push(id) })
		key(controller, 'Enter')
		controller.select('off')
		key(controller, 'ArrowDown')
		key(controller, 'Enter', true)
		expect(events).toEqual([])
		expect(controller.store.get().open).toBe(true)
		expect(key(controller, 'Home')).toBe(false)
		expect(key(controller, 'End')).toBe(false)
		key(controller, 'Enter')
		expect(events).toEqual(['new'])
	})

	it('emits selection, one close, and the legacy action in order', () => {
		const events: string[] = []
		const { controller } = setup({
			items: [{ key: 'a', onSelect: () => events.push('action') }],
			onValueChange: (id) => events.push(id),
			onOpenChange: () => events.push('close'),
		})

		controller.select('a')
		controller.close()
		controller.select('a')
		expect(events).toEqual(['a', 'close', 'action'])
	})

	it('preselects by ID in grouped order rather than the source array index', () => {
		const { controller } = setup({ value: 'settings' })
		expect(controller.store.get().highlighted).toBe('settings')
		key(controller, 'ArrowUp')
		expect(controller.store.get().highlighted).toBe('new')
	})

	it('discards superseded results without requiring cancel()', async () => {
		const slow = deferred()
		const { controller } = setup({
			searchSource: {
				bootstrap: () => [],
				search: (query) => (query === 'slow' ? slow.promise : [{ id: 'fast', label: 'Fast' }]),
			},
		})

		controller.search('slow')
		controller.search('fast')
		slow.resolve([{ id: 'slow', label: 'Slow' }])
		await tick()
		expect(controller.store.get().results.map((item) => item.id)).toEqual(['fast'])
	})

	it('invalidates external close and reboots with a clean query', async () => {
		const slow = deferred()
		const { props, controller } = setup({
			searchSource: { bootstrap: () => [], search: () => slow.promise },
		})

		controller.search('old')
		props.open = false
		controller.configure()
		slow.resolve([{ id: 'ghost', label: 'Ghost' }])
		await tick()
		props.open = true
		controller.configure()
		expect(controller.store.get()).toMatchObject({ query: '', results: [], status: 'ready' })
	})

	it('rejects a late response after internal close or disposal', async () => {
		for (const dispose of [false, true]) {
			const slow = deferred()
			const { controller } = setup({
				searchSource: { bootstrap: () => [], search: () => slow.promise },
			})

			controller.search('old')
			if (dispose) {
				controller.dispose()
			} else {
				controller.close()
			}

			slow.resolve([{ id: 'ghost', label: 'Ghost' }])
			await tick()
			expect(controller.store.get().results).toEqual([])
		}
	})

	it('cancels old sources and reruns the current query after replacement', async () => {
		const slow = deferred()
		let cancelled = 0
		const { props, controller } = setup({
			searchSource: {
				bootstrap: () => [],
				search: () => slow.promise,
				cancel: () => {
					cancelled++
				},
			},
		})

		controller.search('query')
		props.searchSource = {
			bootstrap: () => [],
			search: (query) => [{ id: query, label: 'New source' }],
		}

		controller.configure()
		slow.resolve([{ id: 'old', label: 'Old' }])
		await tick()
		expect(cancelled).toBeGreaterThan(0)
		expect(controller.store.get().results[0].id).toBe('query')
	})

	it('shows promise rejection as an error and supports retry', async () => {
		const request = deferred()
		const { props, controller } = setup({
			searchSource: { bootstrap: () => [], search: () => request.promise },
		})

		controller.search('fail')
		expect(controller.store.get().status).toBe('loading')
		request.reject(new Error('offline'))
		await tick()
		expect(controller.store.get().status).toBe('error')
		props.searchSource!.search = () => [{ id: 'ok', label: 'Success' }]
		controller.search('fail')
		expect(controller.store.get().status).toBe('ready')
	})

	it('closes once whether the parent accepts or ignores the request, and reopens after false', () => {
		for (const accept of [false, true]) {
			let calls = 0
			const { props, controller } = setup({ items: [{ key: 'one', label: 'One' }] })
			props.onOpenChange = (open) => {
				calls++
				if (accept) {
					props.open = open
				}
			}

			controller.configure()
			controller.search('one')
			controller.close()
			controller.close() // Native dismissal completion must not request another close.
			controller.configure()
			expect(calls).toBe(1)
			expect(controller.store.get().open).toBe(false)
			props.open = false
			controller.configure()
			props.open = true
			controller.configure()
			expect(controller.store.get()).toMatchObject({ open: true, query: '', highlighted: null })
		}
	})
})
