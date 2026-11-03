/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalSync,
} from 'octane/universal/native'

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from './Table.macos.tsrx'

// Object-driver source contract only; no AppKit sizing, painting or OS input.
// The children path is what Markdown mounts — a horizontal scrollview must own
// the table so wide content gets a native scroll region like the data path and
// the web leaf's `.vx-table-scroll` wrapper.
function mount(props: any) {
  const container = createObjectContainer('nativescript'),
    root = createUniversalRoot(container, createObjectDriver('nativescript'))

  const render = (next: any) => {
    root.render(Table, next)
    flushUniversalSync(() => {})
  }

  const all = (): any[] => {
    const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
    return container.children.flatMap(walk)
  }

  render(props)
  return { root, render, all }
}

function childrenTable(label: string) {
  return (
    <>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>{label}</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>{label}</TableCell>
        </TableRow>
      </TableBody>
    </>
  )
}

it('children-path tables mount inside a horizontal scroll region', () => {
  const env = mount({ children: childrenTable('head cell') })
  try {
    const scroll = env.all().find((node) => node.type === 'scrollview')
    expect(scroll, 'no scrollview wraps the children-path table').toBeDefined()
    expect(scroll.props.orientation).toBe('horizontal')
    expect(scroll.props.className).toContain('vx-table-scroll')

    const table = scroll.children.find(
      (node: any) => node.type === 'masonview' && node.props?.className?.includes('vx-table'),
    )
    expect(table, 'table element is not the scrollview document child').toBeDefined()
    expect(table.props.style.minWidth).toBeUndefined()
  } finally {
    env.root.unmount()
  }
})

it('scroll region and table element stay mounted across children updates', () => {
  const env = mount({ children: childrenTable('first') })
  try {
    const scroll = env.all().find((node) => node.type === 'scrollview')
    const table = scroll.children.find((node: any) => node.props?.className?.includes('vx-table'))

    env.render({ children: childrenTable('second') })

    const after = env.all().find((node) => node.type === 'scrollview')
    expect(after).toBe(scroll)
    expect(after.children.find((node: any) => node.props?.className?.includes('vx-table'))).toBe(
      table,
    )
  } finally {
    env.root.unmount()
  }
})
