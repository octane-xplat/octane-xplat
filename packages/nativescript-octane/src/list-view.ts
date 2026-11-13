import {
  ContentView,
  type EventData,
  type ItemEventData,
  type ItemsSource,
  type ListView,
  type View,
  type ViewBase,
} from '@nativescript/core'
import {
  defineUniversalComponent,
  type UniversalRenderable,
  type UniversalRoot,
} from 'octane/universal/native'
import { NATIVESCRIPT_RENDERER_ID } from './config.js'

/** Renders one row into a recycled cell; the driver passes the current `items[index]`. */
export type RenderItem = (item: any, index: number) => UniversalRenderable

interface CellProps {
  renderItem: RenderItem
  item: unknown
  index: number
}

/**
 * Every cell root renders this one component, so a rebind is an update of
 * the same component — a diff of the cell's tree — rather than a remount.
 */
const Cell = defineUniversalComponent<CellProps>(NATIVESCRIPT_RENDERER_ID, (props) =>
  props.renderItem(props.item, props.index),
)

interface CellState {
  readonly host: ContentView
  readonly root: UniversalRoot
  renderItem: RenderItem | null
  item: unknown
  index: number
}

interface ListState {
  readonly view: ListView
  readonly createRoot: (host: ViewBase) => UniversalRoot
  readonly cells: Set<CellState>
  readonly onItemLoading: (data: EventData) => void
  renderItem: RenderItem
}

const lists = new WeakMap<ListView, ListState>()
const cells = new WeakMap<View, CellState>()

function itemAt(items: ListView['items'] | null | undefined, index: number) {
  if (items == null) {
    return undefined
  }
  const source = items as ItemsSource
  return typeof source.getItem === 'function' ? source.getItem(index) : (items as unknown[])[index]
}

function createCell(state: ListState): CellState {
  const host = new ContentView()
  const cell: CellState = {
    host,
    root: state.createRoot(host),
    renderItem: null,
    item: undefined,
    index: -1,
  }
  cells.set(host, cell)
  state.cells.add(cell)
  return cell
}

function bind(state: ListState, cell: CellState, index: number): void {
  const item = itemAt(state.view.items, index)
  if (cell.renderItem === state.renderItem && cell.index === index && Object.is(cell.item, item)) {
    return
  }
  cell.renderItem = state.renderItem
  cell.item = item
  cell.index = index
  cell.root.render(Cell, { renderItem: state.renderItem, item, index })
}

/**
 * Take over a list's cells: `itemTemplate` vends a host per cell, and
 * `itemLoading` binds the host to the row the table asks for. A changed
 * `renderItem` re-renders the live cells in place, so a closure over parent
 * state (a selection, say) reaches the rows without a reload.
 */
export function setRenderItem(
  view: ListView,
  renderItem: RenderItem | null,
  createRoot: (host: ViewBase) => UniversalRoot,
): void {
  const state = lists.get(view)
  if (renderItem === null) {
    if (state !== undefined) {
      releaseListView(view)
    }
    return
  }
  if (state === undefined) {
    const created: ListState = {
      view,
      createRoot,
      renderItem,
      cells: new Set(),
      onItemLoading(data) {
        const args = data as ItemEventData
        let cell = args.view ? cells.get(args.view) : undefined
        if (cell === undefined) {
          cell = createCell(created)
          args.view = cell.host
        }
        bind(created, cell, args.index)
      },
    }
    lists.set(view, created)
    view.on('itemLoading', created.onItemLoading)
    view.itemTemplate = () => createCell(created).host
    return
  }
  if (state.renderItem === renderItem) {
    return
  }
  state.renderItem = renderItem
  const length = state.view.items?.length ?? 0
  for (const cell of state.cells) {
    if (cell.renderItem !== null && cell.index < length) {
      bind(state, cell, cell.index)
    }
  }
}

/** Unmount every cell root; for a list whose view is being discarded. */
export function releaseListView(view: ListView): void {
  const state = lists.get(view)
  if (state === undefined) {
    return
  }
  lists.delete(view)
  view.off('itemLoading', state.onItemLoading)
  for (const cell of state.cells) {
    cells.delete(cell.host)
    cell.root.unmount()
  }
  state.cells.clear()
}
