import { afterEach, expect, it, vi } from 'vitest'
vi.mock('@nativescript/core', () => ({
  Screen: { mainScreen: { heightDIPs: 800 } },
  FlexboxLayout: class {
    parent: any
    children: any[] = []
    listeners = new Map<string, any>()
    addChild(child: any) {
      this.children.push(child)
      child.parent = this
    }
    on(name: string, read: any) {
      this.listeners.set(name, read)
    }
    off(name: string) {
      this.listeners.delete(name)
    }
  },
}))

import { attachSheetDetents } from './sheet-detents'
const fixture = () => {
  const host: any = {
    style: { paddingBottom: 12 },
    translateY: 0,
    parent: { getActualSize: () => ({ height: 800 }) },
    getActualSize: () => ({ height: 640 }),
    children: [] as any[],
    addChild(child: any) {
      this.children.push(child)
      child.parent = this
    },
    removeChild(child: any) {
      this.children = this.children.filter((entry: any) => entry !== child)
      child.parent = null
    },
  }
  return host
}

afterEach(() => vi.useRealTimers())
it('keeps bottom content inside the current detent while gesture transforms change', () => {
  vi.useFakeTimers()
  const host = fixture(),
    close = vi.fn(),
    changed = vi.fn()
  const controller = attachSheetDetents(host, [0.5, 0.8], close, { onOffset: changed })
  controller.enter()
  expect(host.height).toBe(640)
  expect(host.style.paddingBottom).toBeCloseTo(252)
  const pan = host.children[0].listeners.get('pan')
  host.translateY = 240
  pan({ state: 1, deltaY: 0 })
  pan({ state: 2, deltaY: -240 })
  expect(host.translateY).toBe(0)
  expect(host.style.paddingBottom).toBe(12)
  controller.detach()
  expect(host.style.paddingBottom).toBe(12)
  expect(vi.getTimerCount()).toBe(0)
  expect(host.children).toHaveLength(0)
})

it('ignores native entrance completion or cancellation after presentation teardown', async () => {
  const host = fixture(),
    close = vi.fn(),
    changed = vi.fn()
  let complete: any, reject: any
  host.animate = () =>
    new Promise((resolve, fail) => {
      complete = resolve
      reject = fail
    })
  const controller = attachSheetDetents(host, [0.5, 0.8], close, { onOffset: changed })
  controller.enter()
  controller.detach()
  complete()
  await Promise.resolve()
  expect(changed).not.toHaveBeenCalled()
  expect(close).not.toHaveBeenCalled()
  const second = attachSheetDetents(host, [0.5, 0.8], close, { onOffset: changed })
  second.enter()
  reject(new Error('Presentation closed'))
  await Promise.resolve()
  second.detach()
  expect(close).not.toHaveBeenCalled()
  expect(host.style.paddingBottom).toBe(12)
})

for (const contacts of [
  { ios: { numberOfTouches: 2 } },
  { android: { current: { getPointerCount: () => 2 } } },
]) {
  it('ignores a two-contact pull-down and cancels an existing drag', () => {
    vi.useFakeTimers()
    const host = fixture()
    const close = vi.fn()
    host.animate = ({ translate }: any) => {
      host.translateY = translate.y
      return Promise.resolve()
    }
    const controller = attachSheetDetents(host, [0.5, 0.8], close)
    controller.enter()
    const pan = host.children[0].listeners.get('pan')
    const restingOffset = host.translateY
    pan({ state: 1, deltaY: 0, ...contacts })
    pan({ state: 2, deltaY: 700, ...contacts })
    pan({ state: 3, deltaY: 700 })
    expect(host.translateY).toBe(restingOffset)
    expect(close).not.toHaveBeenCalled()

    pan({ state: 1, deltaY: 0 })
    pan({ state: 2, deltaY: 100 })
    expect(host.translateY).toBe(restingOffset + 100)
    pan({ state: 2, deltaY: 150, ...contacts })
    expect(host.translateY).toBe(restingOffset)
    pan({ state: 2, deltaY: 700 })
    pan({ state: 3, deltaY: 700 })
    expect(host.translateY).toBe(restingOffset)
    expect(close).not.toHaveBeenCalled()
    controller.detach()
  })
}
