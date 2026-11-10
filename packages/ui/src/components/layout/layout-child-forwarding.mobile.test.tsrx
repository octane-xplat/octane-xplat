/** @jsxImportSource @octane-xplat/jsx */
import { createNativeGestureContainer as createObjectContainer } from '../../../tests/native-gesture-object-driver'
import { expect, it, vi } from 'vitest'
import {
  createObjectDriver,
  createUniversalRoot,
  flushUniversalSync,
} from 'octane/universal/native'

vi.mock('@nativescript/core', async () => ({
  View: (await import('../../../tests/native-gesture-object-driver')).NativeGestureView,
  // ui-svg's index.common.ts evaluates NS decorators at import.
  Property: class {
    constructor(_opts?: any) {}
    register() {}
  },
  CSSType: () => () => {},
  registerElement: () => {},
  Screen: { mainScreen: { widthDIPs: 1024, heightDIPs: 768 } },
  Application: { ios: null, android: {}, on() {}, off() {} },
  isIOS: false,
  isAndroid: true,
  Utils: { openUrl: vi.fn() },
}))

vi.mock('./pan.tsrx', () => ({ usePan: () => undefined }))
vi.mock('../../routing/default-router', () => ({
  router: { navigateUrl: () => Promise.resolve({ status: 'not-found' }) },
}))

vi.mock('../media/Icon', () => ({ Icon: null }))
vi.mock('../overlays/Popover', () => ({ Popover: null }))

import { NavIcon } from '../navigation/NavIcon.tsrx'
import { Toolbar } from './Toolbar.tsrx'
import { TabList, Tab } from '../collections/TabList.tsrx'
import { AppShell } from './AppShell.tsrx'
import { SideNav } from '../navigation/SideNav.tsrx'
import { MobileNav } from '../navigation/MobileNav.tsrx'
import { OverflowList } from '../collections/OverflowList.tsrx'
import { SideNavRenderProvider, AppShellMobileProvider } from '../navigation/nav-contexts'

const PLACEMENT = { row: 0, col: 1, flexGrow: 2, alignSelf: 'center', order: 3 }

function Fixture(props: { element: any }) @{
  <>{props.element}</>
}

function render(element: any) {
  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))

  flushUniversalSync(() => root.render(Fixture, { element }))
  return { container, root }
}

function nodes(node: any): any[] {
  return [node, ...(node.children ?? []).flatMap(nodes)]
}

function find(container: any, cls: string) {
  return nodes(container).find((node) => String(node.props?.className).split(' ').includes(cls))
}

// The seven components declare LayoutChildProps; every leaf must fold them
// into the host element's style (issue #182).
function expectPlacement(style: any) {
  expect(style?.gridRow).toBe('1 / span 1')
  expect(style?.gridColumn).toBe('2 / span 1')
  expect(style?.flexGrow).toBe(2)
  expect(style?.alignSelf).toBe('center')
  expect(style?.order).toBe(3)
}

it('NavIcon forwards placement to the icon host', () => {
  const { container, root } = render(<NavIcon icon={<label text="i" />} {...PLACEMENT} />)

  try {
    expectPlacement(find(container, 'vx-navicon')?.props?.style)
  } finally {
    root.unmount()
  }
})

it('Toolbar forwards placement to the host, not a CSS gap', () => {
  const { container, root } = render(
    <Toolbar label="Actions" startContent={<label text="a" />} gap={2} {...PLACEMENT} />,
  )

  try {
    const style = find(container, 'vx-toolbar')?.props?.style

    expectPlacement(style)
    // `gap` is a SpacingStep slot spacing, not a CSS gap on the host.
    expect(style?.gap).toBeUndefined()
  } finally {
    root.unmount()
  }
})

it('TabList forwards placement to the strip host', () => {
  const { container, root } = render(
    <TabList value="a" onChange={() => {}} {...PLACEMENT}>
      <Tab value="a" label="Alpha" />
    </TabList>,
  )

  try {
    expectPlacement(find(container, 'vx-tablist')?.props?.style)
  } finally {
    root.unmount()
  }
})

it('AppShell forwards placement to the shell host', () => {
  const { container, root } = render(
    <AppShell {...PLACEMENT}>
      <masonview />
    </AppShell>,
  )

  try {
    expectPlacement(find(container, 'vx-appshell')?.props?.style)
  } finally {
    root.unmount()
  }
})

it('SideNav forwards placement to the parent-facing shell', () => {
  const { container, root } = render(<SideNav {...PLACEMENT} />)

  try {
    expectPlacement(find(container, 'vx-sidenav-shell')?.props?.style)
  } finally {
    root.unmount()
  }
})

it('SideNav in drawer mode forwards placement through MobileNav', () => {
  const { container, root } = render(
    <AppShellMobileProvider
      value={{
        isMobile: true,
        isMobileNavOpen: true,
        toggleMobileNav: () => {},
        openMobileNav: () => {},
        closeMobileNav: () => {},
        isMobileNavEnabled: true,
        hasAutoToggle: true,
      }}
    >
      <SideNavRenderProvider value="drawer">
        <SideNav {...PLACEMENT} />
      </SideNavRenderProvider>
    </AppShellMobileProvider>,
  )

  try {
    expectPlacement(find(container, 'vx-mobilenav')?.props?.style)
  } finally {
    root.unmount()
  }
})

it('MobileNav forwards placement to the drawer host', () => {
  const { container, root } = render(
    <MobileNav isOpen {...PLACEMENT}>
      <label text="x" />
    </MobileNav>,
  )

  try {
    expectPlacement(find(container, 'vx-mobilenav')?.props?.style)
  } finally {
    root.unmount()
  }
})

it('OverflowList forwards placement and keeps its computed gap', () => {
  const { container, root } = render(
    <OverflowList gap={2} {...PLACEMENT}>
      <label text="a" />
      <label text="b" />
    </OverflowList>,
  )

  try {
    const style = find(container, 'vx-overflowlist')?.props?.style

    expectPlacement(style)
    // `gap` is a SpacingStep; the emitted gap is the resolved dip value.
    expect(style?.gap).toBe(8)
  } finally {
    root.unmount()
  }
})

it('lets an explicit row beat an authored style gridRow', () => {
  const { container, root } = render(
    <NavIcon icon={<label text="i" />} row={0} style={{ gridRow: '9 / span 9' }} />,
  )

  try {
    expect(find(container, 'vx-navicon')?.props?.style?.gridRow).toBe('1 / span 1')
  } finally {
    root.unmount()
  }
})
