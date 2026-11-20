import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  UniversalHostBatch,
  UniversalHostCommand,
  UniversalRoot,
} from 'octane/universal/native'

vi.mock('@nativescript/core', async () => (await import('../tests/core-mock.js')).createCoreMock())

import * as core from '@nativescript/core'
import {
  MockContentView,
  MockFormattedString,
  MockLayoutBase,
  MockTabView,
  MockTabViewItem,
  MockTextBase,
  type MockView,
} from '../tests/core-mock.js'
import {
  createNativeScriptContainer,
  type NativeScriptContainer,
  nativeScriptDriver,
  releaseNativeScriptContainer,
} from './driver.js'
import { type ElementConstructor, registerElement } from './elements.js'

registerElement('test-stack', core.StackLayout as unknown as ElementConstructor)
registerElement('test-grid', core.GridLayout as unknown as ElementConstructor)

type Command = UniversalHostCommand
type Listener = { id: number; priority: 'discrete' }

const create = (id: number, type: string, props: Record<string, unknown> = {}): Command => ({
  op: 'create',
  id,
  type,
  props,
})
const insert = (
  id: number,
  parent: number | null = null,
  before: number | null = null,
): Command => ({ op: 'insert', id, parent, before })
const move = (id: number, parent: number | null = null, before: number | null = null): Command => ({
  op: 'move',
  id,
  parent,
  before,
})
const update = (id: number, props: Record<string, unknown>): Command => ({
  op: 'update',
  id,
  props,
})
const remove = (id: number, parent: number | null = null): Command => ({
  op: 'remove',
  id,
  parent,
})
const event = (id: number, type: string, listener: Listener | null): Command => ({
  op: 'event',
  id,
  type,
  listener,
})
const listener = (id: number): Listener => ({ id, priority: 'discrete' })

const live: NativeScriptContainer[] = []

afterEach(() => {
  for (const container of live.splice(0)) {
    releaseNativeScriptContainer(container)
  }
})

function mount<H extends MockView>(host: H) {
  const container = createNativeScriptContainer(host as unknown as core.ViewBase)
  live.push(container)
  const dispatched: Array<{ listener: number; data: unknown }> = []
  container.root = {
    eventScope: <T>(_priority: unknown, run: () => T) => run(),
    dispatchEvent: (id: number, data: unknown) => {
      dispatched.push({ listener: id, data })
    },
  } as unknown as UniversalRoot
  return {
    container,
    host,
    dispatched,
    apply(...commands: Command[]) {
      const batch: UniversalHostBatch = {
        renderer: 'nativescript',
        version: 1,
        commands,
      }
      nativeScriptDriver.prepareBatch(container, batch, {} as never).apply()
    },
    view<T>(id: number): T {
      return nativeScriptDriver.getPublicInstance(container, id) as unknown as T
    },
  }
}

const texts = (layout: MockLayoutBase) =>
  layout.children.map((child) => (child as MockTextBase).text)

describe('nativeScriptDriver', () => {
  it('builds the view tree from create and insert commands, honouring before', () => {
    const { apply, host, view } = mount(new MockLayoutBase())
    apply(
      create(1, 'test-stack', { className: 'root' }),
      create(2, 'label', { text: 'a' }),
      create(3, 'label', { text: 'b' }),
      insert(1),
      insert(3, 1),
      insert(2, 1, 3),
    )
    const stack = view<MockLayoutBase>(1)
    expect(host.children).toEqual([stack])
    expect(stack).toBeInstanceOf(core.StackLayout)
    expect(stack.className).toBe('root')
    expect(texts(stack)).toEqual(['a', 'b'])

    apply(move(2, 1, null))
    expect(texts(stack)).toEqual(['b', 'a'])

    apply(remove(2, 1))
    expect(texts(stack)).toEqual(['b'])
    expect(view<MockView>(2).parent).toBeNull()
  })

  it('folds #text children into the host text', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(
      create(1, 'label'),
      create(2, '#text', { value: 'Hello' }),
      create(3, '#text', { value: ' world' }),
      insert(1),
      insert(2, 1),
      insert(3, 1),
    )
    const label = view<MockTextBase>(1)
    expect(label.text).toBe('Hello world')

    apply(update(3, { value: '!' }))
    expect(label.text).toBe('Hello!')

    apply(remove(2, 1))
    expect(label.text).toBe('!')

    apply(remove(3, 1))
    expect(label.text).toBe('')
  })

  it('requests new text measurement for changed child text and direct text props', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(create(1, 'label'), create(2, '#text', { value: 'Short' }), insert(1), insert(2, 1))
    const label = view<MockTextBase>(1)
    const request = vi.spyOn(label, 'requestLayout')

    apply(update(2, { value: 'Longer text that must wrap in its existing host' }))
    expect(request).toHaveBeenCalledTimes(1)
    request.mockClear()
    apply(update(2, { value: 'Longer text that must wrap in its existing host' }))
    expect(request).not.toHaveBeenCalled()
    apply(update(2, { value: 'Short' }))
    expect(request).toHaveBeenCalledTimes(1)
    expect(view(1)).toBe(label)

    apply(create(3, 'label', { text: 'Short' }), insert(3))
    const direct = view<MockTextBase>(3)
    const directRequest = vi.spyOn(direct, 'requestLayout')
    apply(update(3, { text: 'A longer direct text prop' }))
    expect(directRequest).toHaveBeenCalledTimes(1)
    expect(direct.text).toBe('A longer direct text prop')
  })

  it('invalidates the owning label when a nested span text value changes', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(
      create(1, 'label'),
      create(2, 'formattedstring'),
      create(3, 'span'),
      create(4, '#text', { value: 'Short' }),
      insert(1),
      insert(2, 1),
      insert(3, 2),
      insert(4, 3),
    )
    const label = view<MockTextBase>(1)
    const request = vi.spyOn(label, 'requestLayout')
    apply(update(4, { value: 'A longer nested text value' }))
    expect(request).toHaveBeenCalledTimes(1)
    request.mockClear()
    apply(update(3, { text: 'A direct span value' }))
    expect(request).toHaveBeenCalledTimes(1)
    expect(view(1)).toBe(label)
  })

  it('resets props omitted from the complete update snapshot', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(create(1, 'label', { row: 2, text: 'a' }), insert(1))
    apply(update(1, { text: 'b' }))
    const label = view<MockTextBase & { row: number }>(1)
    expect(label.text).toBe('b')
    expect(label.row).toBeUndefined()
  })

  it('maps className and style onto the view', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(create(1, 'label', { className: 'title', style: 'color: red' }), insert(1))
    const label = view<MockTextBase>(1)
    expect(label.className).toBe('title')
    expect(label.inlineStyle).toBe('color: red')

    apply(update(1, { className: null, style: { color: 'blue' } }))
    expect(label.className).toBe(core.unsetValue)
    expect(label.style.color).toBe('blue')
  })

  it('dispatches view events to the root and detaches removed listeners', () => {
    const { apply, view, dispatched } = mount(new MockLayoutBase())
    apply(create(1, 'button'), insert(1), event(1, 'tap', listener(7)))
    const button = view<MockTextBase>(1)
    const data = { eventName: 'tap', object: button }
    button.notify(data)
    expect(dispatched).toEqual([{ listener: 7, data }])

    apply(event(1, 'tap', null))
    button.notify(data)
    expect(dispatched).toHaveLength(1)
  })

  it('mutes the change event a prop write provokes, but not an edit', () => {
    const { apply, view, dispatched } = mount(new MockLayoutBase())
    apply(create(1, 'textfield', { text: 'a' }), insert(1), event(1, 'textChange', listener(9)))
    const field = view<MockTextBase>(1)
    apply(update(1, { text: 'b' }))
    expect(field.text).toBe('b')
    expect(dispatched).toEqual([])

    field.text = 'c'
    expect(dispatched).toEqual([
      {
        listener: 9,
        data: expect.objectContaining({ eventName: 'textChange', value: 'c' }),
      },
    ])
  })

  it('defers events raised while a batch is applying', async () => {
    class LoadingLayout extends MockLayoutBase {
      override insertChild(child: MockView, index: number): void {
        super.insertChild(child, index)
        child.notify({ eventName: 'loaded', object: child })
      }
    }
    const { apply, dispatched } = mount(new LoadingLayout())
    apply(create(1, 'label'), event(1, 'loaded', listener(3)), insert(1))
    expect(dispatched).toHaveLength(0)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(dispatched).toHaveLength(1)
    expect(dispatched[0].listener).toBe(3)
  })

  it('collapses hidden hosts', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(create(1, 'label'), insert(1), {
      op: 'visibility',
      id: 1,
      state: 'hidden',
    })
    expect(view<MockView>(1).visibility).toBe('collapse')
    apply({ op: 'visibility', id: 1, state: 'visible' })
    expect(view<MockView>(1).visibility).toBe('visible')
  })

  it('hosts a single child in a ContentView', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(create(1, 'contentview'), create(2, 'label'), insert(1), insert(2, 1))
    const scroll = view<MockContentView>(1)
    const label = view<MockView>(2)
    expect(scroll.content).toBe(label)

    apply(remove(2, 1))
    expect(scroll.content).toBeNull()
  })

  it('hosts tab view items, each taking its child as the item view', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(
      create(1, 'tabview'),
      create(2, 'tabviewitem', { title: 'Home' }),
      create(3, 'test-stack'),
      create(4, 'tabviewitem', { title: 'Demos' }),
      create(5, 'label'),
      insert(1),
      insert(2, 1),
      insert(3, 2),
      insert(4, 1),
      insert(5, 4),
    )
    const tabView = view<MockTabView>(1)
    const home = view<MockTabViewItem>(2)
    const demos = view<MockTabViewItem>(4)
    expect(tabView.items).toEqual([home, demos])
    expect(home.view).toBe(view(3))
    expect(demos.view).toBe(view(5))
    expect(home.parent).toBe(tabView)
  })

  it('assigns the items once per batch, after every child has attached', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(
      create(1, 'tabview'),
      create(2, 'tabviewitem'),
      create(3, 'label'),
      create(4, 'tabviewitem'),
      create(5, 'label'),
      insert(1),
      insert(2, 1),
      insert(3, 2),
      insert(4, 1),
      insert(5, 4),
    )
    const tabView = view<MockTabView>(1)
    expect(tabView.assignments).toBe(1)
    expect(tabView.items).toEqual([view(2), view(4)])

    apply(create(6, 'tabviewitem'), create(7, 'label'), insert(6, 1), insert(7, 6))
    expect(tabView.assignments).toBe(2)
    expect(tabView.items).toEqual([view(2), view(4), view(6)])
  })

  it('lists an item only once it holds a view', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(create(1, 'tabview'), create(2, 'tabviewitem'), insert(1), insert(2, 1))
    expect(view<MockTabView>(1).items ?? []).toEqual([])

    apply(create(3, 'label'), insert(3, 2))
    expect(view<MockTabView>(1).items).toEqual([view(2)])
  })

  it('keeps items in node order and drops removed ones', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(
      create(1, 'tabview'),
      create(2, 'tabviewitem'),
      create(3, 'label'),
      create(4, 'tabviewitem'),
      create(5, 'label'),
      insert(1),
      insert(2, 1),
      insert(3, 2),
      insert(4, 1, 2),
      insert(5, 4),
    )
    expect(view<MockTabView>(1).items).toEqual([view(4), view(2)])

    apply(remove(4, 1))
    expect(view<MockTabView>(1).items).toEqual([view(2)])
    expect(view<MockTabViewItem>(4).parent).toBeNull()
  })

  it('leaves the items untouched when a re-applied batch changes nothing', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(
      create(1, 'tabview'),
      create(2, 'tabviewitem'),
      create(3, 'label'),
      insert(1),
      insert(2, 1),
      insert(3, 2),
    )
    const items = view<MockTabView>(1).items

    apply(update(2, { title: 'Home' }))

    expect(view<MockTabView>(1).items).toBe(items)
  })

  it('recreates a tab view with its items when its element class is replaced', () => {
    const { apply, host, view } = mount(new MockLayoutBase())
    apply(
      create(1, 'tabview'),
      create(2, 'tabviewitem'),
      create(3, 'label'),
      insert(1),
      insert(2, 1),
      insert(3, 2),
    )
    const previous = view<MockTabView>(1)

    class ReplacedTabView extends MockTabView {}
    registerElement('tabview', ReplacedTabView as unknown as ElementConstructor)

    const tabView = view<MockTabView>(1)
    expect(tabView).not.toBe(previous)
    expect(tabView).toBeInstanceOf(ReplacedTabView)
    expect(host.children).toEqual([tabView])
    expect(tabView.items).toEqual([view(2)])
    expect(view<MockTabViewItem>(2).parent).toBe(tabView)
    registerElement('tabview', MockTabView as unknown as ElementConstructor)
  })

  it('assigns hostSlot children to the parent property', () => {
    class SlotHost extends MockLayoutBase {
      mainContent: MockView | null = null
    }
    registerElement('slothost', SlotHost as unknown as ElementConstructor)
    const { apply, view } = mount(new MockLayoutBase())
    apply(
      create(1, 'slothost'),
      create(2, 'label', { hostSlot: 'mainContent' }),
      insert(1),
      insert(2, 1),
    )
    const slotHost = view<SlotHost>(1)
    expect(slotHost.mainContent).toBe(view<MockView>(2))
    expect(slotHost.children).toHaveLength(0)

    apply(remove(2, 1))
    expect(slotHost.mainContent).toBeNull()
  })

  it('nests formatted strings and spans', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(
      create(1, 'label'),
      create(2, 'formattedstring'),
      create(3, 'span', { text: 'x' }),
      insert(1),
      insert(2, 1),
      insert(3, 2),
    )
    const label = view<MockTextBase>(1)
    const formatted = view<MockFormattedString>(2)
    expect(label.formattedText).toBe(formatted)
    expect(formatted.spans).toEqual([view(3)])

    apply(remove(3, 2), remove(2, 1))
    expect(formatted.spans).toEqual([])
    expect(label.formattedText).toBeNull()
  })

  it('sets an ActionBar child as its titleView', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(create(1, 'actionbar'), create(2, 'label'), insert(1), insert(2, 1))
    expect(view<core.ActionBar>(1).titleView).toBe(view(2))
  })

  it('recreate swaps a node for another type in place', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(
      create(1, 'test-stack'),
      create(2, 'label', { text: 'a' }),
      create(3, 'label', { text: 'c' }),
      insert(1),
      insert(2, 1),
      insert(3, 1),
    )
    const previous = view<MockTextBase>(2)
    apply({ op: 'recreate', id: 2, type: 'button', props: { text: 'b' } })
    const stack = view<MockLayoutBase>(1)
    expect(stack.children[0]).toBeInstanceOf(core.Button)
    expect(texts(stack)).toEqual(['b', 'c'])
    expect(previous.parent).toBeNull()
  })

  it('recreate keeps the record: children, position and listeners survive', () => {
    const { apply, container, view, dispatched } = mount(new MockLayoutBase())
    apply(
      create(1, 'test-stack'),
      create(2, 'label', { text: 'kept' }),
      create(3, 'label', { text: 'last' }),
      insert(1),
      insert(2, 1),
      insert(3, 1),
      event(2, 'tap', listener(7)),
    )
    const node = container.nodes.get(1)

    apply({ op: 'recreate', id: 1, type: 'test-grid', props: {} })

    const grid = view<MockLayoutBase>(1)
    expect(grid).toBeInstanceOf(core.GridLayout)
    expect(grid.children).toEqual([view(2), view(3)])
    // The record is the same object, and its children still point at it —
    // commands addressed to them keep flowing to the live tree.
    expect(container.nodes.get(1)).toBe(node)
    expect(node?.children.map((child) => child.id)).toEqual([2, 3])
    apply(update(2, { text: 'still here' }))
    expect(view<MockTextBase>(2).text).toBe('still here')
    view<MockView>(2).notify({ eventName: 'tap', object: view(2) })
    expect(dispatched.map((entry) => entry.listener)).toEqual([7])
  })

  it("does not park a detached node's view on the host when its tag is re-registered", () => {
    const { apply, host, view } = mount(new MockLayoutBase())
    apply(create(1, 'label'), insert(1), remove(1))
    // The record survives a remove: still registered, logically detached.
    class LabelNext extends MockTextBase {}
    try {
      registerElement('label', LabelNext as unknown as ElementConstructor)
      const next = view<MockTextBase>(1)
      expect(next).toBeInstanceOf(LabelNext)
      expect(host.children).toEqual([])
      expect(next.parent).toBeNull()
    } finally {
      registerElement('label', core.Label as unknown as ElementConstructor)
    }
  })

  it('mutes the change echo a folded text write raises', () => {
    const { apply, view, dispatched } = mount(new MockLayoutBase())
    apply(
      create(1, 'textfield'),
      create(2, '#text', { value: 'a' }),
      insert(1),
      insert(2, 1),
      event(1, 'textChange', listener(9)),
    )
    const field = view<MockTextBase>(1)
    apply(update(2, { value: 'b' }))
    expect(field.text).toBe('b')
    expect(dispatched).toEqual([])

    field.text = 'c'
    expect(dispatched).toEqual([
      {
        listener: 9,
        data: expect.objectContaining({ eventName: 'textChange', value: 'c' }),
      },
    ])
  })

  it("drops a folded span when a formattedstring's last #text child leaves", () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(
      create(1, 'label'),
      create(2, 'formattedstring'),
      create(3, '#text', { value: 'minted' }),
      create(4, 'span', { text: 'kept' }),
      insert(1),
      insert(2, 1),
      insert(3, 2),
      insert(4, 2),
    )
    const formatted = view<MockFormattedString>(2)
    const kept = view(4)
    expect(formatted.spans).toEqual([expect.anything(), kept])

    apply(remove(3, 2))
    // The minted span left with its owner — the detached text no longer renders.
    expect(formatted.spans).toEqual([kept])

    apply(insert(3, 2))
    expect(formatted.spans).toEqual([kept, expect.objectContaining({ text: 'minted' })])
  })

  it('recreates live views when a tag is re-registered', () => {
    const { apply, view, dispatched } = mount(new MockLayoutBase())
    apply(
      create(1, 'test-stack'),
      create(2, 'label', { className: 'x' }),
      create(3, '#text', { value: 'hi' }),
      create(4, 'label', { text: 'z' }),
      insert(1),
      insert(2, 1),
      insert(3, 2),
      insert(4, 1),
      event(2, 'tap', listener(5)),
    )
    const previous = view<MockTextBase>(2)
    class LabelNext extends MockTextBase {}
    registerElement('label', LabelNext as unknown as ElementConstructor)
    try {
      const next = view<MockTextBase>(2)
      expect(next).not.toBe(previous)
      expect(next).toBeInstanceOf(LabelNext)
      expect(next.className).toBe('x')
      expect(next.text).toBe('hi')
      expect(previous.parent).toBeNull()

      const stack = view<MockLayoutBase>(1)
      expect(stack.children).toEqual([next, view(4)])
      expect(texts(stack)).toEqual(['hi', 'z'])

      next.notify({ eventName: 'tap', object: next })
      expect(dispatched.map((entry) => entry.listener)).toEqual([5])
    } finally {
      registerElement('label', core.Label as unknown as ElementConstructor)
    }
    expect(view<MockTextBase>(2)).toBeInstanceOf(core.Label)
  })

  it('forgets destroyed nodes', () => {
    const { apply } = mount(new MockLayoutBase())
    apply(create(1, 'label'), { op: 'destroy', id: 1 })
    expect(() => apply(update(1, {}))).toThrow(/unknown host 1/)
  })

  it('rejects a batch with an unregistered element before any command applies', () => {
    const { apply, container, host } = mount(new MockLayoutBase())
    expect(() =>
      apply(create(1, 'test-stack'), insert(1), create(2, 'nope'), insert(2, 1)),
    ).toThrow(/<nope> is not a registered element/)
    expect(host.children).toEqual([])
    expect(container.nodes.size).toBe(0)
  })

  it('rejects commands against unknown hosts before any command applies', () => {
    const { apply, container, host } = mount(new MockLayoutBase())
    expect(() => apply(insert(9))).toThrow(/unknown host 9/)
    expect(() => apply(update(9, {}))).toThrow(/unknown host 9/)
    expect(() => apply(remove(9))).toThrow(/unknown host 9/)
    expect(() => apply(event(9, 'tap', listener(1)))).toThrow(/unknown host 9/)
    expect(() => apply({ op: 'visibility', id: 9, state: 'hidden' })).toThrow(/unknown host 9/)
    // An insert into an unknown parent fails identically.
    expect(() => apply(create(1, 'test-stack'), insert(1, 9))).toThrow(/unknown host 9/)
    // So does a command against an id destroyed earlier in the same batch.
    expect(() => apply(create(2, 'label'), { op: 'destroy', id: 2 }, update(2, {}))).toThrow(
      /unknown host 2/,
    )
    expect(host.children).toEqual([])
    expect(container.nodes.size).toBe(0)
  })

  it('accepts references to ids created earlier in the batch', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(
      create(1, 'test-stack'),
      create(2, 'label', { text: 'hi' }),
      insert(2, 1),
      insert(1),
      update(2, { text: 'bye' }),
    )
    expect(texts(view<MockLayoutBase>(1))).toEqual(['bye'])
  })

  it('rejects inserts that close an ownership cycle before applying', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(create(1, 'test-stack'), create(2, 'test-stack'), insert(1), insert(2, 1))
    const stack = view<MockLayoutBase>(1)
    expect(() => apply(insert(1, 2))).toThrow(/ownership cycle/)
    expect(() => apply(insert(1, 1))).toThrow(/ownership cycle/)
    // The rejected batches never ran: the tree is unchanged.
    expect(stack.children).toEqual([view<MockLayoutBase>(2)])
    expect(view<MockLayoutBase>(2).parent).toBe(stack)
  })

  it('rejects an inactive portal target as an insert parent before applying', () => {
    const { apply, container } = mount(new MockLayoutBase())
    const forged = {
      $$kind: 'octane.universal.portal-target',
      renderer: 'nativescript',
      root: 0,
      id: 'forged',
    } as const
    expect(() =>
      apply(create(1, 'label'), {
        op: 'insert',
        id: 1,
        parent: forged,
        before: null,
      } as UniversalHostCommand),
    ).toThrow(/inactive portal target/)
    expect(container.nodes.size).toBe(0)
  })

  it('releases the previous node when a create re-registers its id', () => {
    const { apply, view, container } = mount(new MockLayoutBase())
    apply(
      create(1, 'test-stack'),
      create(2, 'label', { text: 'first' }),
      insert(1),
      insert(2, 1),
      event(2, 'tap', listener(3)),
    )
    const previous = view<MockTextBase>(2)
    const previousNode = container.nodes.get(2)

    apply(create(2, 'label', { text: 'second' }))

    const replacement = view<MockTextBase>(2)
    expect(replacement).not.toBe(previous)
    expect(replacement.text).toBe('second')
    // The superseded node and view are fully released: unparented, unlistened,
    // and spliced from the parent's logical and native child lists.
    expect(container.nodes.get(2)).not.toBe(previousNode)
    expect(previous.parent).toBeNull()
    expect(previous.handlers.get('tap')?.size ?? 0).toBe(0)
    const stack = view<MockLayoutBase>(1)
    expect(stack.children).toEqual([])
    expect(container.nodes.get(1)?.children).toEqual([])
  })

  it('detaches a destroyed view that was never removed', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(
      create(1, 'test-stack'),
      create(2, 'label'),
      insert(1),
      insert(2, 1),
      event(2, 'tap', listener(4)),
    )
    const label = view<MockTextBase>(2)
    const stack = view<MockLayoutBase>(1)

    apply({ op: 'destroy', id: 2 })

    expect(label.parent).toBeNull()
    expect(stack.children).toEqual([])
    expect(label.handlers.get('tap')?.size ?? 0).toBe(0)
    expect(() => apply(update(2, {}))).toThrow(/unknown host 2/)
  })

  it('converges a retried batch after a mid-apply failure instead of stacking trees', () => {
    let failures = 1
    class FlakyLayout extends MockLayoutBase {
      override insertChild(child: MockView, index: number): void {
        if (failures > 0) {
          failures--
          throw new Error('native insert failed')
        }
        super.insertChild(child, index)
      }
    }
    registerElement('flaky-stack', FlakyLayout as unknown as ElementConstructor)
    const { apply, host, view } = mount(new MockLayoutBase())
    const commands: Command[] = [
      create(1, 'flaky-stack'),
      insert(1),
      create(2, 'label', { text: 'leaf' }),
      insert(2, 1),
    ]
    // A native failure mid-apply leaves the first attempt's views mounted.
    expect(() => apply(...commands)).toThrow(/native insert failed/)
    const orphaned = view<MockLayoutBase>(1)
    expect(host.children).toEqual([orphaned])

    apply(...commands)

    // The retried batch released the first attempt's tree: exactly one stack
    // and one label remain, and nothing stays attached to the orphan.
    const stack = view<MockLayoutBase>(1)
    expect(stack).not.toBe(orphaned)
    expect(host.children).toEqual([stack])
    expect(texts(stack)).toEqual(['leaf'])
    expect(orphaned.parent).toBeNull()
    expect(orphaned.children).toEqual([])
  })

  it('rejects batches for another renderer and unknown tags', () => {
    const { apply, container } = mount(new MockLayoutBase())
    const batch: UniversalHostBatch = {
      renderer: 'dom',
      version: 1,
      commands: [],
    }
    expect(() => nativeScriptDriver.prepareBatch(container, batch, {} as never)).toThrow(
      /does not match/,
    )
    expect(() => apply(create(1, 'nope'))).toThrow(/<nope> is not a registered element/)
  })

  it('classifies handler props as discrete host events', () => {
    expect(nativeScriptDriver.events?.classify('onTap')).toEqual({
      type: 'tap',
      priority: 'discrete',
    })
    expect(nativeScriptDriver.events?.classify('onLoaded')).toEqual({
      type: 'loaded',
      priority: 'discrete',
    })
    expect(nativeScriptDriver.events?.classify('text')).toBeNull()
  })
})
