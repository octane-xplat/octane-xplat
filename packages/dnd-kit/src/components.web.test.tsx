/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { View } from '@octane-xplat/ui'
import { DndContext, useDraggable, useDroppable } from './index.web'

/** jsdom supplies no DOMMatrixReadOnly; the gesture host composes ancestor
 *  transforms through it. Drag offsets come from pointer deltas, so an
 *  identity 2D stub that honors matrix()/matrix3d() is sufficient. */
class Matrix {
  a = 1
  b = 0
  c = 0
  d = 1
  is2D = true
  constructor(value: string) {
    if (/matrix3d\(/.test(value)) {
      this.is2D = false
      return
    }

    const matrix = /matrix\(([^)]+)\)/.exec(value)?.[1].split(',').map(Number)

    if (matrix && matrix.length >= 6) {
      ;[this.a, this.b, this.c, this.d] = matrix
    }
  }
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'DOMMatrixReadOnly', { configurable: true, value: Matrix })
}

const roots: ReturnType<typeof createRoot>[] = []

function mount(jsx: any) {
  const element = document.createElement('div')

  document.body.append(element)

  const root = createRoot(element)

  roots.push(root)
  act(() => root.render(jsx))
  return { element }
}

function pointer(type: string, clientX: number, clientY: number): PointerEvent {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX,
    clientY,
  })

  Object.defineProperties(event, {
    pointerId: { value: 1 },
    pointerType: { value: 'mouse' },
  })
  return event as PointerEvent
}

function setBounds(element: Element, top: number) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: top,
    left: 0,
    top,
    right: 40,
    bottom: top + 40,
    width: 40,
    height: 40,
    toJSON: () => ({}),
  } as DOMRect)
}

async function flush() {
  for (let i = 0; i < 40; i++) {
    await Promise.resolve()
  }
}

function DragSource() {
  const drag = useDraggable({ id: 'source' })

  return <View id="drag-source" ref={drag.ref} onPan={drag.onPan} style={drag.style} />
}

function DropTarget() {
  const drop = useDroppable({ id: 'target' })

  return <View id="drop-target" ref={drop.ref} style={{ height: 40 }} />
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount())
  }

  document.body.innerHTML = ''
})

describe('@octane-xplat/dnd-kit (web)', () => {
  it('starts and completes a drop from pointer events on ref-attached Views', async () => {
    const onDragStart = vi.fn()
    const onDragEnd = vi.fn()
    const { element } = mount(
      <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <DragSource />
        <DropTarget />
      </DndContext>,
    )

    await flush()

    const source = element.querySelector('#drag-source')!
    const target = element.querySelector('#drop-target')!

    setBounds(source, 0)
    setBounds(target, 80)

    act(() => source.dispatchEvent(pointer('pointerdown', 20, 20)))
    await flush()
    act(() => source.dispatchEvent(pointer('pointermove', 20, 100)))
    await flush()
    act(() => source.dispatchEvent(pointer('pointerup', 20, 100)))
    await flush()

    expect(onDragStart).toHaveBeenCalledTimes(1)
    expect(onDragEnd).toHaveBeenCalledTimes(1)
    expect(onDragEnd.mock.calls[0]?.[0]).toMatchObject({
      active: { id: 'source' },
      over: { id: 'target' },
      canceled: false,
    })
  })

  it('reports pointer cancellation without a successful drop', async () => {
    const onDragEnd = vi.fn()
    const onDragCancel = vi.fn()
    const { element } = mount(
      <DndContext onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
        <DragSource />
        <DropTarget />
      </DndContext>,
    )

    await flush()

    const source = element.querySelector('#drag-source')!

    setBounds(source, 0)
    act(() => source.dispatchEvent(pointer('pointerdown', 20, 20)))
    await flush()
    // Pan activates after the 8px convenience threshold; cancel mid-drag.
    act(() => source.dispatchEvent(pointer('pointermove', 20, 100)))
    await flush()
    act(() => source.dispatchEvent(pointer('pointercancel', 20, 100)))
    await flush()

    expect(onDragCancel).toHaveBeenCalledTimes(1)
    expect(onDragEnd).not.toHaveBeenCalled()
  })
})
