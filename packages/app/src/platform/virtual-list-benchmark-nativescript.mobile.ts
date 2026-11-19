import { Application } from '@nativescript/core'
import { findInRootLayouts } from '@octane-xplat/ui/nativescript'
import {
  VIRTUAL_LIST_BENCH_INTERVAL_MS,
  runVirtualListInputTrace,
  runVirtualListBenchTrace,
  virtualListBenchHandles,
  type VirtualListBenchAdapter,
  type VirtualListBenchSnapshot,
} from '../virtual-list-benchmark'

import { observeAndroidFrames } from './virtual-list-benchmark-frame-metrics'

const hostIds = new WeakMap<object, number>()
let nextHostId = 1

function collect(view: any, out: any[] = []): any[] {
  if (!view) {
    return out
  }

  out.push(view)
  view.eachChildView?.((child: any) => {
    collect(child, out)
    return true
  })

  return out
}

function readSnapshot(list: any): VirtualListBenchSnapshot {
  if (!list) {
    return { offset: 0, viewportHeight: 0, rows: [], mountedIndices: [] }
  }

  const listY = Number(list.getLocationOnScreen?.()?.y ?? 0)
  const viewportHeight = Number(list.getActualSize?.()?.height ?? 0)
  const views = collect(list)
  const rows = views.flatMap((view) => {
    const match = /^(?:vlist-bench-row-|row-r)(\d+)$/.exec(String(view.id ?? ''))

    if (!match) {
      return []
    }

    // The measured row includes its separator; item-only boxes leave intentional gaps.
    let row = view

    for (let parent = view.parent; parent && parent !== list; parent = parent.parent) {
      if (
        String(parent.className ?? '')
          .split(' ')
          .includes('vx-virtual-list-row')
      ) {
        row = parent
        break
      }
    }

    const top = Number(row.getLocationOnScreen?.()?.y ?? Number.NaN) - listY
    const height = Number(row.getActualSize?.()?.height ?? 0)

    if (!Number.isFinite(top) || height <= 0) {
      return []
    }

    return [{ index: Number(match[1]), top, bottom: top + height }]
  })

  const slotBoxes = views.flatMap((view) => {
    if (!/\bvx-virtual-list-(header|footer|empty)\b/.test(String(view.className ?? ''))) {
      return []
    }

    const top = Number(view.getLocationOnScreen?.()?.y ?? Number.NaN) - listY
    const height = Number(view.getActualSize?.()?.height ?? 0)

    return Number.isFinite(top) && height > 0 ? [{ top, bottom: top + height }] : []
  })

  const pooledHosts = views.filter((view) =>
    String(view.className ?? '')
      .split(' ')
      .includes('vx-virtual-list-cell'),
  )

  const hosts = pooledHosts.length
    ? pooledHosts
    : views.filter((view) =>
        String(view.className ?? '')
          .split(' ')
          .includes('vx-virtual-list-row'),
      )

  const mountedCellIds = hosts.map((view) => {
    const nativeHost = view.nativeViewProtected ?? view
    let id = hostIds.get(nativeHost)

    if (id === undefined) {
      id = nextHostId++
      hostIds.set(nativeHost, id)
    }

    return id
  })

  return {
    mountedCellIds,
    coverageBoxes: [...rows, ...slotBoxes],
    offset: Number(list.scrollTop ?? 0),
    viewportHeight,
    rows,
    mountedIndices: rows.map((row) => row.index),
  }
}

export async function runVirtualListBenchmark(listId: string, root?: any) {
  const appRoot: any = Application.getRootView?.()
  const list: any =
    root?.getViewById?.(listId) ?? findInRootLayouts(listId) ?? appRoot?.getViewById?.(listId)

  const adapter: VirtualListBenchAdapter = {
    target: Application.android != null ? 'android' : Application.ios != null ? 'ios' : 'windows',
    read: () => readSnapshot(list),
    writeOffset: (offset) => virtualListBenchHandles.get(listId)?.scrollToOffset(offset),
    wait: () => new Promise<void>((resolve) => setTimeout(resolve, VIRTUAL_LIST_BENCH_INTERVAL_MS)),
  }

  return runVirtualListBenchTrace(adapter)
}

export async function runVirtualListInputBenchmark(
  listId: string,
  durationMs = 20_000,
  root?: any,
) {
  const appRoot: any = Application.getRootView?.()
  const list: any =
    root?.getViewById?.(listId) ?? findInRootLayouts(listId) ?? appRoot?.getViewById?.(listId)

  const frames = observeAndroidFrames()

  try {
    const result = await runVirtualListInputTrace(
      {
        target: Application.android != null ? 'android' : Application.ios != null ? 'ios' : 'windows',
        read: () => readSnapshot(list),
        wait: () =>
          new Promise<void>((resolve) => setTimeout(resolve, VIRTUAL_LIST_BENCH_INTERVAL_MS)),
      },
      durationMs,
      listId === 'vlist' ? 500 : undefined,
    )

    const rowWidths = collect(list)
      .filter((view) =>
        String(view.className ?? '')
          .split(' ')
          .includes('vx-virtual-list-row'),
      )
      .map((view) => Number(view.getActualSize?.()?.width ?? 0))

    return {
      ...result,
      framePacing: frames.result(),
      layoutWidths: {
        viewport: Number(list?.getActualSize?.()?.width ?? 0),
        rowMin: Math.min(...rowWidths),
        rowMax: Math.max(...rowWidths),
      },
    }
  } finally {
    frames.dispose()
  }
}

