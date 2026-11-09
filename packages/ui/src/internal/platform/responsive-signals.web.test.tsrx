/** @jsxImportSource @octane-xplat/jsx/dom */
import { act, createRoot } from 'octane'
import { derived$, isWritableSignal } from 'octane/signals'
import { afterEach, expect, it, vi } from 'vitest'
import { useMediaQuery$ } from './use-media-query.web.tsrx'
import { useBreakpoints$ } from '../../../../platform/src/breakpoints.web.tsrx'
import { useWindowSize$ } from '../../../../platform/src/screen.web.tsrx'

const desktop = vi.hoisted(() => ({
  size: undefined as { width: number; height: number; orientation: 'landscape' } | undefined,
  listeners: new Set<(size: { width: number; height: number; orientation: 'landscape' }) => void>(),
}))

vi.mock('../../../../platform/src/host-runtime.web', () => ({
  desktopHostBootstrap: () => (desktop.size ? { windowSize: desktop.size } : undefined),
  desktopHostClient: () =>
    desktop.size
      ? {
          on: (_event: string, listener: (size: typeof desktop.size) => void) => {
            desktop.listeners.add(listener)
            return () => desktop.listeners.delete(listener)
          },
        }
      : undefined,
}))

const cleanups: (() => void)[] = []

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) {
    cleanup()
  }

  desktop.size = undefined
  desktop.listeners.clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function Responsive(props: { query: string; threshold: number }) @{
  const match$ = useMediaQuery$(props.query)
  const size$ = useWindowSize$()
  const matches$ = useBreakpoints$({ wide: props.threshold })
  const label$ = derived$(() => `${size$.get().width}/${matches$.get().wide}/${match$.get()}`)

  <>
    <output>{label$.get()}</output>
    <span>{`${isWritableSignal(match$)}/${isWritableSignal(size$)}/${isWritableSignal(matches$)}`}</span>
  </>
}

it('updates composed values and releases media and dimension subscriptions on unmount', () => {
  let matches = false
  const listeners = new Map<string, Set<() => void>>()

  vi.stubGlobal('matchMedia', (query: string) => {
    const callbacks = listeners.get(query) ?? new Set<() => void>()

    listeners.set(query, callbacks)
    return {
      get matches() {
        return matches
      },
      addEventListener: (_event: string, cb: () => void) => callbacks.add(cb),
      removeEventListener: (_event: string, cb: () => void) => callbacks.delete(cb),
    }
  })

  Object.defineProperty(window, 'innerWidth', { value: 700, writable: true, configurable: true })

  const add = vi.spyOn(window, 'addEventListener')
  const remove = vi.spyOn(window, 'removeEventListener')
  const host = document.createElement('div')
  const root = createRoot(host)

  cleanups.push(() => {
    root.unmount()
    host.remove()
  })

  act(() => root.render(<Responsive query="(min-width: 800px)" threshold={800} />))
  expect(host.querySelector('output')?.textContent).toBe('700/false/false')
  expect(host.querySelector('span')?.textContent).toBe('false/false/false')
  act(() => {
    window.innerWidth = 900
    window.dispatchEvent(new Event('resize'))
    matches = true
    for (const cb of listeners.get('(min-width: 800px)') ?? []) {
      cb()
    }
  })

  expect(host.querySelector('output')?.textContent).toBe('900/true/true')
  act(() => root.render(<Responsive query="(min-width: 1000px)" threshold={1000} />))
  expect(listeners.get('(min-width: 800px)')?.size).toBe(0)
  expect(listeners.get('(min-width: 1000px)')?.size).toBe(1)
  expect(host.querySelector('output')?.textContent).toBe('900/false/true')
  act(() => root.unmount())
  expect(listeners.get('(min-width: 1000px)')?.size).toBe(0)
  for (const [event, listener] of add.mock.calls) {
    if (event === 'resize' || event === 'orientationchange') {
      expect(remove).toHaveBeenCalledWith(event, listener)
    }
  }
})

it('uses false when matchMedia is missing', () => {
  vi.stubGlobal('matchMedia', undefined)

  const host = document.createElement('div')
  const root = createRoot(host)

  cleanups.push(() => root.unmount())
  act(() => root.render(<Responsive query="(min-width: 800px)" threshold={800} />))
  expect(host.querySelector('output')?.textContent).toMatch(/\/false$/)
})

it('derives breakpoint matches from desktop host dimensions rather than browser geometry', () => {
  desktop.size = { width: 600, height: 400, orientation: 'landscape' }
  window.innerWidth = 1500
  vi.stubGlobal('matchMedia', undefined)

  const host = document.createElement('div')
  const root = createRoot(host)

  cleanups.push(() => root.unmount())
  act(() => root.render(<Responsive query="(min-width: 800px)" threshold={800} />))
  expect(host.querySelector('output')?.textContent).toBe('600/false/false')
  act(() => {
    const next = { width: 1000, height: 500, orientation: 'landscape' as const }

    for (const listener of desktop.listeners) {
      listener(next)
    }
  })

  expect(host.querySelector('output')?.textContent).toBe('1000/true/false')
  act(() => root.unmount())
  expect(desktop.listeners.size).toBe(0)
})
