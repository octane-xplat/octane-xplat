import { afterEach, describe, expect, it, vi } from 'vitest'
import { universalPlan, universalValue } from 'octane/universal/native'

vi.mock('@nativescript/core', async () => (await import('../tests/core-mock.js')).createCoreMock())

import * as core from '@nativescript/core'
import {
  MockContentView,
  MockLayoutBase,
  MockListView,
  MockTextBase,
  type MockView,
} from '../tests/core-mock.js'
import {
  create,
  destroy,
  event,
  insert,
  listener,
  mount,
  releaseMounted,
  remove,
  update,
} from '../tests/mount.js'

afterEach(releaseMounted)

type Row = { name: string }

const labelPlan = universalPlan('nativescript', {
  kind: 'host',
  type: 'label',
  bindings: [['text', 0]],
})
const renderRow = (row: Row, index: number) => universalValue(labelPlan, [`${index}:${row.name}`])
const rows = (...names: string[]): Row[] => names.map((name) => ({ name }))

function cellText(list: MockListView, position: number): string {
  const host = list.cells[position].view as unknown as MockContentView
  return (host.content as unknown as MockTextBase).text
}

describe('listview renderItem', () => {
  it('hosts a root per cell and binds it to the row the table asks for', () => {
    const { apply, view } = mount(new MockLayoutBase())
    apply(create(1, 'listview', { items: rows('a', 'b'), renderItem: renderRow }), insert(1))
    const list = view<MockListView>(1)
    list.show(0, 1)
    expect(list.cells[0].view).toBeInstanceOf(core.ContentView)
    expect(cellText(list, 0)).toBe('0:a')
    expect(cellText(list, 1)).toBe('1:b')
  })

  it('skips a rebind to the same row and re-renders a recycled cell', () => {
    const renderItem = vi.fn(renderRow)
    const { apply, view } = mount(new MockLayoutBase())
    apply(create(1, 'listview', { items: rows('a', 'b', 'c'), renderItem }), insert(1))
    const list = view<MockListView>(1)
    list.show(0, 1)
    expect(renderItem).toHaveBeenCalledTimes(2)

    list.refresh()
    expect(renderItem).toHaveBeenCalledTimes(2)

    list.reuse(0, 2)
    expect(cellText(list, 0)).toBe('2:c')
    expect(renderItem).toHaveBeenCalledTimes(3)
  })

  it('binds the current items[index] rather than a snapshot', () => {
    const items = rows('a', 'b')
    const { apply, view } = mount(new MockLayoutBase())
    apply(create(1, 'listview', { items, renderItem: renderRow }), insert(1))
    const list = view<MockListView>(1)
    list.show(0, 1)

    items[0] = { name: 'z' }
    list.refresh()
    expect(cellText(list, 0)).toBe('0:z')
    expect(cellText(list, 1)).toBe('1:b')

    apply(update(1, { items: rows('x', 'y'), renderItem: renderRow }))
    expect(cellText(list, 0)).toBe('0:x')
    expect(cellText(list, 1)).toBe('1:y')
  })

  it('reads an ItemsSource through getItem', () => {
    const source = {
      length: 2,
      getItem: (index: number): Row => ({ name: `s${index}` }),
    }
    const { apply, view } = mount(new MockLayoutBase())
    apply(create(1, 'listview', { items: source, renderItem: renderRow }), insert(1))
    const list = view<MockListView>(1)
    list.show(1)
    expect(cellText(list, 0)).toBe('1:s1')
  })

  it('re-renders live cells in place when renderItem changes identity', () => {
    const items = rows('a', 'b')
    const { apply, view } = mount(new MockLayoutBase())
    apply(create(1, 'listview', { items, renderItem: renderRow }), insert(1))
    const list = view<MockListView>(1)
    list.show(0, 1)
    const host = list.cells[0].view
    const reloads = list.reloads

    apply(
      update(1, {
        items,
        renderItem: (row: Row, index: number) =>
          universalValue(labelPlan, [`${index}=${row.name}`]),
      }),
    )
    expect(cellText(list, 0)).toBe('0=a')
    expect(cellText(list, 1)).toBe('1=b')
    expect(list.cells[0].view).toBe(host)
    expect(list.reloads).toBe(reloads)
  })

  it('still dispatches the app onItemLoading, after the cell is bound', () => {
    const { apply, view, dispatched } = mount(new MockLayoutBase())
    apply(
      create(1, 'listview', { items: rows('a'), renderItem: renderRow }),
      insert(1),
      event(1, 'itemLoading', listener(4)),
    )
    const list = view<MockListView>(1)
    list.show(0)
    expect(dispatched).toEqual([
      {
        listener: 4,
        data: expect.objectContaining({ index: 0, view: list.cells[0].view }),
      },
    ])
    expect(cellText(list, 0)).toBe('0:a')
  })

  it('unmounts the cell roots when the list is destroyed', () => {
    const items = rows('a', 'b')
    const { apply, view } = mount(new MockLayoutBase())
    apply(create(1, 'listview', { items, renderItem: renderRow }), insert(1))
    const list = view<MockListView>(1)
    list.show(0, 1)
    const hosts = list.cells.map((cell) => cell.view as unknown as MockContentView)
    expect(hosts.every((host) => host.content !== null)).toBe(true)

    apply(remove(1), destroy(1))
    expect(hosts.every((host) => host.content === null)).toBe(true)
  })

  it('keeps deferring events raised by a batch that nests a cell render', async () => {
    class LoadingLayout extends MockLayoutBase {
      override insertChild(child: MockView, index: number): void {
        super.insertChild(child, index)
        child.notify({ eventName: 'loaded', object: child })
      }
    }
    const { apply, view, dispatched } = mount(new LoadingLayout())
    apply(create(1, 'listview', { items: rows('a'), renderItem: renderRow }), insert(1))
    view<MockListView>(1).show(0)

    apply(
      update(1, { items: rows('b'), renderItem: renderRow }),
      create(2, 'label'),
      event(2, 'loaded', listener(3)),
      insert(2),
    )
    expect(dispatched).toEqual([])
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(dispatched.map((entry) => entry.listener)).toEqual([3])
  })
})
