/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createUniversalRoot, flushUniversalSync } from 'octane/universal/native'

import { useState } from 'octane'
import {
  createNativeGestureContainer,
  NativeGestureView,
} from '../../ui/tests/native-gesture-object-driver'

import {
  createNativeGestureDriver,
  dispatchFixtureContacts,
} from '../../ui/tests/native-gesture-surface'

vi.mock('@nativescript/core', () => ({
  isIOS: false,
  isAndroid: true,
  Application: { on() {}, off() {} },
  View: NativeGestureView,
  Property: class {
    constructor(_o?: any) {}
    register() {}
  },
  CSSType: () => () => {},
}))

vi.mock(
  '../../ui/src/gestures/native-surface',
  () => import('../../ui/tests/native-gesture-surface'),
)

// Exercise control state without loading the native SVG plugin in the object driver.
vi.mock('../../ui/src/components/media/svg', () => ({}))
vi.mock('@octane-xplat/ui', () => import('../tests/native-controls.mobile.tsrx'))

import { DataGrid } from './DataGrid.tsrx'

const roots: { unmount(): void }[] = []

afterEach(() => roots.splice(0).forEach((root) => root.unmount()))

const data = [
  { id: 'a', name: 'Alice' },
  { id: 'b', name: 'Bob' },
  { id: 'c', name: 'Charlie' },
]

const columns = [{ accessorKey: 'name', header: 'Name' }]

function find(nodes: any[], id: string): any {
  for (const node of nodes) {
    if (node.props?.id === id) {
      return node
    }

    const child = find(node.children ?? [], id)

    if (child) {
      return child
    }
  }
}

function Controlled() {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  return (
    <DataGrid
      id="grid"
      data={data}
      columns={columns}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.original.name}
      showRowSelection
      showPagination
      state={{ rowSelection }}
      options={{ onRowSelectionChange: setRowSelection }}
      initialState={{ pagination: { pageIndex: 0, pageSize: 2 } }}
    />
  )
}

describe('native DataGrid selection integration', () => {
  it('updates retained controls for caller state, mixed selection and off-page ordinals', () => {
    const container = createNativeGestureContainer('nativescript')
    const root = createUniversalRoot(container, createNativeGestureDriver(container))

    roots.push(root)
    root.render(Controlled as any, {})

    const get = (id: string) => find(container.children, id)
    const press = (id: string) =>
      flushUniversalSync(() => container.dispatchEvent(get(id), 'tap', {}))

    const page = get('grid-select-page')

    expect(get('grid-select-a').props.accessibilityLabel).toBe('Select Alice')
    expect(get('grid-select-a').props.accessibilityHint).toBe('Row 1 of 3')
    press('grid-select-a')
    expect(get('grid-select-page')).toBe(page)
    expect(page.props.accessibilityValue).toBe('Partially selected')
    expect(page.props.accessibilityState).toBeUndefined()
    press('grid-select-page')
    expect(page.props.accessibilityValue).toBeUndefined()
    expect(page.props.accessibilityState).toBe('checked')
    press('grid-next')
    expect(get('grid-select-c').props.accessibilityHint).toBe('Row 3 of 3')
    expect(page.props.accessibilityState).toBe('unchecked')
    press('grid-clear-selection')
    press('grid-previous')
    expect(get('grid-select-a').props.accessibilityState).toBe('unchecked')
  })
})

// Normalized contact ingress exercises the real shared owner, not OS input.
it.each(['ltr', 'rtl'] as const)(
  'resizes and reorders with %s native contacts and rolls back cancellation',
  (direction) => {
    const container = createNativeGestureContainer('nativescript')
    const root = createUniversalRoot(container, createNativeGestureDriver(container))

    roots.push(root)

    let table: any

    root.render(DataGrid, {
      id: 'grid',
      data,
      columns: [
        { accessorKey: 'name', size: 140, minSize: 100, maxSize: 180 },
        { accessorKey: 'id', size: 100 },
      ],
      resizableColumns: true,
      reorderableColumns: true,
      direction,
      renderSelectionActions: (value: any) => {
        table = value
        return null
      },
      showRowSelection: true,
    })

    let time = 0
    const send = (id: string, type: 'down' | 'move' | 'up' | 'cancel', x: number) => {
      const host = find(container.children, id)
      const changed = { id: 'one', kind: 'touch' as const, window: { x, y: 0 }, screen: null }

      flushUniversalSync(() =>
        dispatchFixtureContacts(container, {
          type,
          time: (time += 100),
          changed,
          contacts: type === 'up' || type === 'cancel' ? [] : [changed],
          hitPath: [host],
        }),
      )
    }

    const dx = direction === 'rtl' ? -200 : 200

    send('grid-th-name-resize', 'down', 0)
    send('grid-th-name-resize', 'move', dx)
    expect(table.getColumn('name').getSize()).toBe(180)
    send('grid-th-name-resize', 'cancel', dx)
    expect(table.getColumn('name').getSize()).toBe(140)
    send('grid-th-name-resize', 'down', 0)
    send('grid-th-name-resize', 'move', dx)
    send('grid-th-name-resize', 'up', dx)
    expect(table.getColumn('name').getSize()).toBe(180)
    send('grid-th-name-drag', 'down', 0)
    send('grid-th-name-drag', 'move', dx)
    send('grid-th-name-drag', 'cancel', dx)
    expect(table.getVisibleLeafColumns().map((column: any) => column.id)).toEqual(['name', 'id'])
    send('grid-th-name-drag', 'down', 0)
    send('grid-th-name-drag', 'move', dx)
    send('grid-th-name-drag', 'up', dx)
    expect(table.getVisibleLeafColumns().map((column: any) => column.id)).toEqual(['id', 'name'])
  },
)
