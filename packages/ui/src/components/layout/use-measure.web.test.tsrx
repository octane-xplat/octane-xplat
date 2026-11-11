/** @jsxImportSource @octane-xplat/jsx/dom */
import { act, createRoot } from 'octane'
import { derived$, isWritableSignal, type DerivedSignal } from 'octane/signals'
import { afterEach, expect, it, vi } from 'vitest'
import { useMeasure$ } from './useMeasure.web.tsrx'
import type { MeasureBounds } from '../../props'

const cleanups: (() => void)[] = []

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) {
    cleanup()
  }

  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function Width(props: { bounds$: DerivedSignal<MeasureBounds | null> }) @{
  const doubled$ = derived$(() => (props.bounds$.get()?.width ?? 0) * 2)

  <output>{doubled$.get()}</output>
}

function Measurement(props: {
  observe?: boolean
  bind?: boolean
  capture: (bounds$: DerivedSignal<MeasureBounds | null>) => void
}) @{
  const measurement = useMeasure$({ observe: props.observe })

  props.capture(measurement.bounds$)

  <>
    <div ref={props.bind === false ? undefined : measurement.ref} />
    <Width bounds$={measurement.bounds$} />
  </>
}

function fixture(observe = true) {
  let width = 100
  let notify = () => {}
  const disconnect = vi.fn()

  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        notify = callback
      }
      observe() {}
      disconnect = disconnect
    },
  )

  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    x: 10,
    y: 20,
    left: 10,
    top: 20,
    right: 10 + width,
    bottom: 60,
    width,
    height: 40,
    toJSON() {},
  }))

  const host = document.createElement('div')

  document.body.appendChild(host)

  const root = createRoot(host)
  let bounds$: DerivedSignal<MeasureBounds | null>
  const capture = (value$: DerivedSignal<MeasureBounds | null>) => {
    bounds$ = value$
  }

  const render = (bind = true) =>
    act(() => root.render(<Measurement observe={observe} bind={bind} capture={capture} />))

  render()
  cleanups.push(() => {
    root.unmount()
    host.remove()
  })

  return {
    host,
    disconnect,
    render,
    read$: () => bounds$,
    resize(next: number) {
      width = next
      act(() => notify())
    },
  }
}

it('updates a derived child reader without requiring its parent to sample bounds', () => {
  const h = fixture()

  expect(h.host.querySelector('output')?.textContent).toBe('200')
  expect(isWritableSignal(h.read$())).toBe(false)
  h.resize(160)
  expect(h.host.querySelector('output')?.textContent).toBe('320')
  expect(h.read$().get()).toMatchObject({ x: 10, y: 20, width: 160, height: 40 })
})

it('clears on detach, disconnects observation, and measures a rebound element', () => {
  const h = fixture()

  h.render(false)
  expect(h.read$().get()).toBe(null)
  expect(h.disconnect).toHaveBeenCalledOnce()
  h.render()
  expect(h.host.querySelector('output')?.textContent).toBe('200')
})

it('takes a single measurement without installing ResizeObserver when observe is false', () => {
  const h = fixture(false)

  expect(h.read$().get()?.width).toBe(100)
  h.resize(200)
  expect(h.read$().get()?.width).toBe(100)
  expect(h.disconnect).not.toHaveBeenCalled()
})

it('stays null for a detached host and publishes a real zero size once connected', () => {
  let width = 0
  let height = 0
  let notify = () => {}

  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        notify = callback
      }
      observe() {}
      disconnect() {}
    },
  )

  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON() {},
  }))

  const host = document.createElement('div')
  const root = createRoot(host)
  let bounds$: DerivedSignal<MeasureBounds | null>
  const capture = (value$: DerivedSignal<MeasureBounds | null>) => {
    bounds$ = value$
  }

  act(() => root.render(<Measurement observe={true} capture={capture} />))
  cleanups.push(() => {
    root.unmount()
    host.remove()
  })

  expect(bounds$!.get()).toBe(null)

  document.body.appendChild(host)
  act(() => notify())
  expect(bounds$!.get()).toEqual({ x: 0, y: 0, width: 0, height: 0 })

  width = 80
  height = 24
  act(() => notify())
  expect(bounds$!.get()).toEqual({ x: 0, y: 0, width: 80, height: 24 })
})
