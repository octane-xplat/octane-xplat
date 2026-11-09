/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, createRoot } from 'octane'
import { NavIcon } from '../navigation/NavIcon.web.tsrx'
import { Toolbar } from './Toolbar.web.tsrx'
import { TabList, Tab } from '../collections/TabList.web.tsrx'
import { AppShell } from './AppShell.web.tsrx'
import { SideNav } from '../navigation/SideNav.web.tsrx'
import { MobileNav } from '../navigation/MobileNav.web.tsrx'
import { OverflowList } from '../collections/OverflowList.web.tsrx'
import { SideNavRenderProvider, AppShellMobileProvider } from '../navigation/nav-contexts'

// jsdom gaps used by the leaves under test.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      onchange: null,
      dispatchEvent: () => false,
    }) as any
}

const roots: any[] = []

function mount(element: any) {
  const el = document.createElement('div')

  document.body.append(el)

  const root = createRoot(el)

  roots.push(root)
  act(() => root.render(element))
  return el
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount())
  }

  document.body.innerHTML = ''
})

// The seven components declare LayoutChildProps; every leaf must fold them
// into the host element's style (issue #182).
const PLACEMENT = { row: 0, col: 1, flexGrow: 2, alignSelf: 'center', order: 3 }

function expectPlacement(style: CSSStyleDeclaration) {
  expect(style.gridRow).toBe('1 / span 1')
  expect(style.gridColumn).toBe('2 / span 1')
  expect(style.flexGrow).toBe('2')
  expect(style.alignSelf).toBe('center')
  expect(style.order).toBe('3')
}

describe('LayoutChildProps forwarding (web leaves)', () => {
  it('NavIcon forwards placement to the icon host', () => {
    const el = mount(<NavIcon icon={<i />} {...PLACEMENT} />)

    expectPlacement((el.querySelector('.vx-navicon') as HTMLElement).style)
  })

  it('Toolbar forwards placement to the outer chrome, not a CSS gap', () => {
    const el = mount(<Toolbar startContent={<b />} gap={2} {...PLACEMENT} />)
    const toolbar = el.querySelector('.vx-toolbar') as HTMLElement

    expectPlacement(toolbar.style)
    // `gap` is a SpacingStep slot spacing, not a CSS gap on the host.
    expect(toolbar.style.gap).toBe('')
  })

  it('TabList forwards placement to the nav host', () => {
    const el = mount(
      <TabList value="a" onChange={() => {}} {...PLACEMENT}>
        <Tab value="a" label="Alpha" />
      </TabList>,
    )

    expectPlacement((el.querySelector('.vx-tablist') as HTMLElement).style)
  })

  it('AppShell forwards placement to the shell host', () => {
    const el = mount(
      <AppShell {...PLACEMENT}>
        <div />
      </AppShell>,
    )

    expectPlacement((el.querySelector('.vx-appshell') as HTMLElement).style)
  })

  it('SideNav forwards placement to the parent-facing shell', () => {
    const el = mount(<SideNav {...PLACEMENT} />)

    expectPlacement((el.querySelector('.vx-sidenav-shell') as HTMLElement).style)
  })

  it('SideNav in drawer mode forwards placement through MobileNav', () => {
    const el = mount(
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

    expectPlacement((el.querySelector('.vx-mobilenav') as HTMLElement).style)
  })

  it('MobileNav forwards placement to the dialog host', () => {
    const el = mount(
      <MobileNav isOpen {...PLACEMENT}>
        <span />
      </MobileNav>,
    )

    expectPlacement((el.querySelector('.vx-mobilenav') as HTMLElement).style)
  })

  it('OverflowList forwards placement and keeps its computed gap', () => {
    const el = mount(
      <OverflowList gap={2} {...PLACEMENT}>
        <i />
        <i />
      </OverflowList>,
    )
    const list = el.querySelector('.vx-overflowlist') as HTMLElement

    expectPlacement(list.style)
    // `gap` is a SpacingStep; the emitted gap is the resolved px value.
    expect(list.style.gap).toBe('8px')
  })

  it('keeps authored style alongside placement', () => {
    const el = mount(<NavIcon icon={<i />} row={0} style={{ width: 24 }} />)
    const host = el.querySelector('.vx-navicon') as HTMLElement

    expect(host.style.gridRow).toBe('1 / span 1')
    expect(host.style.width).toBe('24px')
  })

  it('lets an explicit row beat an authored style gridRow', () => {
    const el = mount(<NavIcon icon={<i />} row={0} style={{ gridRow: '9 / span 9' }} />)

    expect((el.querySelector('.vx-navicon') as HTMLElement).style.gridRow).toBe('1 / span 1')
  })

  it('preserves a string style alongside placement', () => {
    const el = mount(<NavIcon icon={<i />} row={0} style="width: 24px" />)
    const host = el.querySelector('.vx-navicon') as HTMLElement

    expect(host.style.gridRow).toBe('1 / span 1')
    expect(host.style.width).toBe('24px')
  })
})
