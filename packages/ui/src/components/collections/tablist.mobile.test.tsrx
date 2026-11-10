/** @jsxImportSource @octane-xplat/jsx */
import { createNativeGestureContainer as createObjectContainer } from '../../../tests/native-gesture-object-driver'
// Action/layout fixture only: no native input is delivered by the object driver.
vi.mock('../../gestures/host.tsrx', () => import('../../../tests/interaction-host-mock.tsrx'))
vi.mock('../../gestures/host.macos.tsrx', () => import('../../../tests/interaction-host-mock.tsrx'))

import { dispatchTestInput } from '../../../tests/interaction-host-mock.tsrx'
import { expect, it, vi } from 'vitest'
import { createObjectDriver, createUniversalRoot } from 'octane/universal/native'

vi.mock('@nativescript/core', async () => ({
  View: (await import('../../../tests/native-gesture-object-driver')).NativeGestureView,
  // ui-svg's index.common.ts evaluates NS decorators at import.
  Property: class {
    constructor(_opts?: any) {}
    register() {}
  },
  CSSType: () => () => {},
  registerElement: () => {},
  Application: { ios: null, android: {}, on() {}, off() {} },
  isIOS: false,
  isAndroid: true,
  Utils: { openUrl: vi.fn() },
}))

vi.mock('../../routing/default-router', () => ({
  router: { navigateUrl: () => Promise.resolve({ status: 'not-found' }) },
}))

vi.mock('../media/Icon', () => ({ Icon: null }))
vi.mock('../overlays/Popover', () => ({ Popover: null }))

import { TabList, Tab } from './TabList.tsrx'

function Fixture(props: { layout: 'fill' | 'hug'; onChange(value: string): void }) @{
  <TabList role="tablist" layout={props.layout} value="first" onChange={props.onChange}>
    <Tab value="first" label="First" />
    <Tab value="second" label="Second" />
  </TabList>
}

function nodes(node: any): any[] {
  return [node, ...(node.children ?? []).flatMap(nodes)]
}

function text(node: any): string {
  return nodes(node)
    .map((child) => child.props?.text ?? (child.type === '#text' ? child.props.value : '') ?? '')
    .join('')
}

for (const layout of ['fill', 'hug'] as const) {
  it(`renders and selects native tabs with ${layout} layout`, () => {
    const container = createObjectContainer('nativescript')
    const root = createUniversalRoot(container, createObjectDriver('nativescript'))
    const selected = vi.fn()

    try {
      root.render(Fixture, { layout, onChange: selected })
      expect(text(container)).toContain('First')
      expect(text(container)).toContain('Second')

      const tab = nodes(container).find(
        (node) =>
          ['button', 'tab'].includes(node.props?.accessibilityRole) && text(node) === 'Second',
      )

      expect(tab).toBeDefined()
      dispatchTestInput(container, tab, 'tap', { eventName: 'tap', object: tab })
      expect(selected).toHaveBeenCalledExactlyOnceWith('second')
    } finally {
      root.unmount()
    }
  })
}
