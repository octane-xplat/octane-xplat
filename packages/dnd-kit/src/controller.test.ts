import { describe, it, expect, vi } from 'vitest'
import { DndController } from './controller'
import { arrayMove } from './sort'

const node = (x: number, y: number, width = 100, height = 40) => ({
	isLoaded: true,
	getLocationOnScreen: () => ({ x, y }),
	getActualSize: () => ({ width, height }),
})

const flush = async () => {
	for (let i = 0; i < 30; i++) {
		await Promise.resolve()
	}
}

const pan = (source: ReturnType<DndController['registerDraggable']>, state: string, dy = 0) =>
	source.onPan?.({ state, dx: 0, dy, x: 0, y: dy, vx: 0, vy: 0, target: null })

function setup() {
	const manager = new DndController()
	manager.draggableNodes.set('a', node(0, 0))
	manager.droppableNodes.set('a', node(0, 0))
	manager.droppableNodes.set('b', node(0, 80))
	const source = manager.registerDraggable({ id: 'a', data: { container: 'first' } })
	manager.registerDroppable({ id: 'a' })
	manager.registerDroppable({ id: 'b', data: { container: 'second' } })
	return { manager, source }
}

describe('native pan substrate and abstract core', () => {
	it('delivers committed transforms and drops over another container', async () => {
		const { manager, source } = setup()
		const start = vi.fn(),
			move = vi.fn(),
			end = vi.fn()

		manager.options = { onDragStart: start, onDragMove: move, onDragEnd: end }
		pan(source, 'began')
		await flush()
		expect(manager.getSnapshot().isDragging).toBe(true)
		pan(source, 'moved', 80)
		await flush()
		expect(manager.getSnapshot().over?.id).toBe('b')
		expect(manager.getSnapshot().transform.y).toBe(80)
		pan(source, 'ended', 80)
		await flush()
		expect(start).toHaveBeenCalledTimes(1)
		expect(move).toHaveBeenCalled()
		expect(end.mock.calls[0]?.[0]).toMatchObject({
			active: { id: 'a' },
			over: { id: 'b' },
			canceled: false,
		})

		expect(manager.getSnapshot().active).toBeNull()
		manager.disposeController()
	})

	it('serializes a quick begin/move/release and permits a second drag', async () => {
		const { manager, source } = setup()
		const end = vi.fn()
		manager.options = { onDragEnd: end }
		pan(source, 'began')
		pan(source, 'moved', 80)
		pan(source, 'ended', 80)
		await flush()
		expect(end.mock.calls[0]?.[0].over?.id).toBe('b')
		pan(source, 'began')
		await flush()
		pan(source, 'ended')
		await flush()
		expect(end).toHaveBeenCalledTimes(2)
		manager.disposeController()
	})

	it('cancels without reporting a successful drop', async () => {
		const { manager, source } = setup()
		const end = vi.fn(),
			cancel = vi.fn()

		manager.options = { onDragEnd: end, onDragCancel: cancel }
		pan(source, 'began')
		await flush()
		pan(source, 'cancelled', 80)
		await flush()
		expect(cancel).toHaveBeenCalledTimes(1)
		expect(end).not.toHaveBeenCalled()
		expect(manager.getSnapshot().active).toBeNull()
		manager.disposeController()
	})

	it('excludes disabled and rejected drop targets', async () => {
		const { manager, source } = setup()
		manager.registry.droppables.get('b')!.disabled = true
		pan(source, 'began')
		await flush()
		pan(source, 'moved', 80)
		await flush()
		expect(manager.getSnapshot().over).toBeNull()
		manager.registry.droppables.get('b')!.disabled = false
		manager.registry.droppables.get('b')!.accept = () => false
		manager.refresh()
		await flush()
		expect(manager.getSnapshot().over).toBeNull()
		manager.disposeController()
		await flush()
	})

	it('does not start disabled or unmeasurable sources and rejects duplicate ids', async () => {
		const { manager, source } = setup()
		source.disabled = true
		pan(source, 'began')
		await flush()
		expect(manager.getSnapshot().active).toBeNull()
		source.disabled = false
		manager.draggableNodes.delete('a')
		pan(source, 'began')
		await flush()
		expect(manager.getSnapshot().active).toBeNull()
		expect(() => manager.registerDraggable({ id: 'a' })).toThrow('Duplicate')
		manager.disposeController()
	})

	it('scrolls while held near an edge, clamps offsets, and stops on cancel', async () => {
		vi.useFakeTimers()
		const { manager, source } = setup()
		const offsetRef = { current: 0 }
		const scrollTo = vi.fn((offset: number) => {
			offsetRef.current = offset
		})

		manager.options = {
			autoScroll: {
				bounds: () => ({ x: 0, y: 0, width: 100, height: 100 }),
				offsetRef,
				maxOffset: () => 20,
				scrollTo,
			},
		}

		pan(source, 'began')
		await flush()
		pan(source, 'moved', 70)
		await flush()
		await vi.advanceTimersByTimeAsync(160)
		expect(offsetRef.current).toBe(20)
		expect(manager.getSnapshot().transform.y).toBe(90)
		manager.cancel()
		await flush()
		expect(manager.getSnapshot().transform).toEqual({ x: 0, y: 0 })
		const calls = scrollTo.mock.calls.length
		await vi.advanceTimersByTimeAsync(100)
		expect(scrollTo).toHaveBeenCalledTimes(calls)
		manager.disposeController()
		vi.useRealTimers()
	})

	it('stops queued input and unregisters sensor bindings on destruction', async () => {
		const { manager, source } = setup()
		pan(source, 'began')
		await flush()
		manager.disposeController()
		pan(source, 'moved', 80)
		await flush()
		expect(source.onPan).toBeUndefined()
		expect(manager.registry.draggables.has('a')).toBe(false)
	})
})

it('arrayMove preserves input and ignores invalid indices', () => {
	const items = ['a', 'b', 'c']
	expect(arrayMove(items, 0, 2)).toEqual(['b', 'c', 'a'])
	expect(items).toEqual(['a', 'b', 'c'])
	expect(arrayMove(items, -1, 2)).toEqual(items)
})
