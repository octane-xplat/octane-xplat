/** @jsxImportSource @octane-xplat/jsx */
import { createNativeGestureContainer as createObjectContainer } from '../../../tests/native-gesture-object-driver'
// Action/layout fixture only: no native input is delivered by the object driver.
vi.mock('../../gestures/host.tsrx', () => import('../../../tests/interaction-host-mock.tsrx'))
vi.mock('../../gestures/host.macos.tsrx', () => import('../../../tests/interaction-host-mock.tsrx'))

import { dispatchTestInput } from '../../../tests/interaction-host-mock.tsrx'
import { describe, expect, it, vi } from 'vitest'
import { createObjectDriver, createUniversalRoot } from 'octane/universal/native'

vi.mock('@nativescript/core', async () => ({
  View: (await import('../../../tests/native-gesture-object-driver')).NativeGestureView,
  isIOS: false,
  isAndroid: true,
}))

import { GridList } from './GridList.tsrx'
import { useGridList } from './use-grid-list.tsrx'

// GridList native lane — tap activates onAction and toggles selection via
// the shared selection mapping; arrow nav/roving tabindex are web-only.
// useGridList returns an inert prop bag with isSupported:false — same shape.

const items = [
  { id: 'a', name: 'Alpha' },
  { id: 'b', name: 'Beta' },
  { id: 'c', name: 'Gamma' },
]

let captured: any

const Probe = (props: any) => @{
    captured = useGridList({ columns: props.columns })

    <label text="probe" />
  }

describe('GridList (universal renderer)', () => {
  it('renders cells and toggles selection + onAction on tap', () => {
    const container = createObjectContainer('nativescript')
    const root = createUniversalRoot(container, createObjectDriver('nativescript'))
    const onAction = vi.fn()
    const onSelectionChange = vi.fn()

    root.render(GridList, {
      items,
      keyExtractor: (item: any) => item.id,
      renderItem: (item: any) => item.name,
      selectionMode: 'multiple',
      onAction,
      onSelectionChange,
    })

    const grid = container.children[0]

    expect(grid.type).toBe('masonview')
    expect(grid.props.style?.flexWrap).toBe('wrap')

    const rows = grid.children

    expect(rows.length).toBe(3)
    expect(rows[0].type).toBe('masonview')

    dispatchTestInput(container, rows[0], 'tap', {})
    expect(onAction).toHaveBeenCalledWith('a')
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['a']))
    dispatchTestInput(container, rows[1], 'tap', {})
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['a', 'b']))
    dispatchTestInput(container, rows[0], 'tap', {})
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['b']))
    root.unmount()
  })

  it('blocks disabled keys and lays out stacked under layout="stack"', () => {
    const container = createObjectContainer('nativescript')
    const root = createUniversalRoot(container, createObjectDriver('nativescript'))
    const onAction = vi.fn()

    root.render(GridList, {
      items,
      keyExtractor: (item: any) => item.id,
      renderItem: (item: any) => item.name,
      layout: 'stack',
      disabledKeys: ['b'],
      onAction,
    })

    const rows = container.children[0].children

    expect(container.children[0].props.style?.flexWrap).toBe('nowrap')
    expect(rows[1].props.accessibilityState).toBe('disabled')
    expect(() => dispatchTestInput(container, rows[1], 'tap', {})).toThrow('no "tap" listener')
    expect(onAction).not.toHaveBeenCalled()
    root.unmount()
  })

  it('useGridList reports keyboard navigation unsupported with an inert prop bag', () => {
    const container = createObjectContainer('nativescript')
    const root = createUniversalRoot(container, createObjectDriver('nativescript'))

    root.render(Probe, { columns: 2 })
    expect(captured.gridRef).toBeDefined()
    expect(captured.isSupported).toBe(false)
    expect(captured.gridProps).toEqual({})
    root.unmount()
  })
})
