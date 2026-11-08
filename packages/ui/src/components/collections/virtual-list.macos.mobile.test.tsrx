/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalSync,
} from 'octane/universal/native'

import { VirtualList } from './VirtualList.macos.tsrx'

const items = ['a', 'b', 'c'].map((id) => ({ id }))

// The native and web leaves forward LayoutChildProps to their hosts; the
// AppKit leaf set style={props.style} directly and dropped placement.
it('AppKit VirtualList forwards layout-child placement to the scrollview host', () => {
  vi.useFakeTimers()

  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))

  try {
    root.render(VirtualList, {
      items,
      renderItem: (item: { id: string }) => item.id,
      row: 1,
      col: 2,
      rowSpan: 2,
    })

    flushUniversalSync(() => {})

    const host = container.children[0]

    expect(host.props.style.gridRow).toBe('2 / span 2')
    expect(host.props.style.gridColumn).toBe('3 / span 1')
  } finally {
    root.unmount()
    vi.useRealTimers()
  }
})
