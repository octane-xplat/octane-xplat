/** @jsxImportSource @octane-xplat/jsx */
import { derived$, type DerivedSignal } from 'octane/signals'
import { expect, it, vi } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalSync,
} from 'octane/universal/native'

import { useMeasure$ } from './useMeasure.tsrx'
import type { MeasureBounds } from '../../props'

vi.mock('@nativescript/core', () => ({ isIOS: false, isAndroid: true }))

function Measured(props: { values: Array<MeasureBounds | null> }) @{
  const measurement = useMeasure$()

  props.values.push(measurement.bounds$.get())

  <masonview ref={measurement.ref} style={{ display: 'flex' }} />
}

function mountWithHosts(host: (instance: any) => any) {
  const container = createObjectContainer('nativescript')
  const driver = createObjectDriver('nativescript')
  const base = driver.getPublicInstance.bind(driver)

  driver.getPublicInstance = (c: any, id: any) => host(base(c, id))

  const root = createUniversalRoot(container, driver)

  return { container, root }
}

it('reports bounds relative to the app surface origin, not the screen', () => {
  const surface = { parent: null, getLocationOnScreen: () => ({ x: 40, y: 60 }) }
  const { root } = mountWithHosts((instance) => {
    instance.parent = surface
    instance.getLocationOnScreen = () => ({ x: 50, y: 80 })
    instance.getActualSize = () => ({ width: 200, height: 100 })
    return instance
  })

  const values: Array<MeasureBounds | null> = []

  flushUniversalSync(() => root.render(Measured, { values }))
  root.unmount()
  expect(values.at(-1)).toEqual({ x: 10, y: 20, width: 200, height: 100 })
})

it('stays null until the host can report a usable layout', () => {
  const { root } = mountWithHosts((instance) => instance)
  const values: Array<MeasureBounds | null> = []

  flushUniversalSync(() => root.render(Measured, { values }))
  root.unmount()
  expect(values.length).toBeGreaterThan(0)
  expect(values.every((b) => b === null)).toBe(true)
})

// The child owns the read; the measuring parent never samples bounds.
function BoundsReader(props: {
  bounds$: DerivedSignal<MeasureBounds | null>
  values: Array<number | null>
}) @{
  const width$ = derived$(() => props.bounds$.get()?.width ?? null)

  props.values.push(width$.get())

  <label text={String(width$.get())} />
}

function MeasuredParent(props: { values: Array<number | null> }) @{
  const { ref, bounds$ } = useMeasure$()

  <masonview ref={ref}>
    <BoundsReader bounds$={bounds$} values={props.values} />
  </masonview>
}

it('updates derived child reads from layout events and releases host listeners on unmount', () => {
  let width = 100
  const listeners = new Map<string, Set<() => void>>()
  const { root } = mountWithHosts((instance) => {
    instance.getLocationOnScreen = () => ({ x: 0, y: 0 })
    instance.getActualSize = () => ({ width, height: 20 })
    instance.on = (event: string, callback: () => void) => {
      const callbacks = listeners.get(event) ?? new Set<() => void>()

      callbacks.add(callback)
      listeners.set(event, callbacks)
    }

    instance.off = (event: string, callback: () => void) => listeners.get(event)?.delete(callback)
    return instance
  })

  const values: Array<number | null> = []

  flushUniversalSync(() => root.render(MeasuredParent, { values }))
  expect(values.at(-1)).toBe(100)
  flushUniversalSync(() => {
    width = 220
    for (const callback of listeners.get('layoutChanged') ?? []) {
      callback()
    }
  })

  expect(values.at(-1)).toBe(220)

  const count = values.length

  flushUniversalSync(() => {
    for (const callback of listeners.get('layoutChanged') ?? []) {
      callback()
    }
  })

  expect(values.length).toBe(count)
  root.unmount()
  expect([...listeners.values()].every((callbacks) => callbacks.size === 0)).toBe(true)
})
