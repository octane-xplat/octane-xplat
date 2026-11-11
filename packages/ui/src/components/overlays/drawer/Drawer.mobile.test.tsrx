/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalSync,
  type ObjectHostInstance,
} from 'octane/universal/native'

import { Drawer } from './Drawer.tsrx'

vi.mock('@nativescript/core', () => ({ isIOS: false, isAndroid: false, Application: {} }))
vi.mock('@nativescript/core/animation-frame', () => ({
  requestAnimationFrame: () => 0,
  cancelAnimationFrame() {},
}))

vi.mock('../../../gestures/external', () => ({
  attachOwnedPan: () => () => {},
  useInputCallbackGuard:
    () =>
    (callback: ((...args: unknown[]) => void) | undefined, ...args: unknown[]) => {
      callback?.(...args)
      return true
    },
}))

vi.mock('../../actions/Pressable.tsrx', () => {
  function Pressable(props: Record<string, unknown>) {
    return <masonview {...props} />
  }

  return { Pressable }
})

type TestView = ObjectHostInstance & { translateX: number; visibility: string }

it('synchronizes controlled commands on the mounted native component without replacing its host', async () => {
  const container = createObjectContainer('nativescript')
  const driver = createObjectDriver('nativescript')
  const original = driver.getPublicInstance
  const views = new Map<number, TestView>()

  driver.getPublicInstance = (parent, id) => {
    const view = original(parent, id)

    if (view && !views.has(id)) {
      const native = Object.assign(view, {
        isLoaded: true,
        translateX: 0,
        visibility: 'hidden',
        opacity: 0,
        getActualSize: () => ({ width: 280, height: 500 }),
        on() {},
        off() {},
      })

      views.set(id, native)
    }

    return view
  }

  const root = createUniversalRoot(container, driver)
  const change = vi.fn()
  const render = async (open: boolean) => {
    flushUniversalSync(() =>
      root.render(Drawer, { id: 'controlled', open, reducedMotion: true, onOpenChange: change }),
    )

    await Promise.resolve()
    await Promise.resolve()
    flushUniversalSync(() => {})
  }

  try {
    await render(false)

    const panel = [...views.values()].find((view) => view.props.id === 'controlled-panel')!

    expect(panel).toBeDefined()
    expect(panel.translateX).toBe(-280)
    await render(true)
    expect(panel.translateX).toBe(0)
    expect(panel.visibility).toBe('visible')
    await render(false)
    expect(panel.translateX).toBe(-280)
    expect(panel.visibility).toBe('hidden')
    expect([...views.values()].find((view) => view.props.id === 'controlled-panel')).toBe(panel)
    expect(change).not.toHaveBeenCalled()
  } finally {
    root.unmount()
  }
})
