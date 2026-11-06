/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
} from 'octane/universal/native'

import { usePinch } from './pinch.tsrx'
import type { PinchEvent } from '../../props'

const events: PinchEvent[] = []

function PinchHost() @{
  const onPinch = usePinch((event) => events.push(event))

  <masonview id="pinch-host" onPinch={onPinch} style={{ display: 'flex' }} />
}

function BareHost() @{
  <masonview id="bare" onPinch={usePinch(undefined)} />
}

function mountPinchHost() {
  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))
  root.render(PinchHost, {})
  return { container, root, host: container.children[0] }
}

afterEach(() => {
  events.length = 0
  vi.unstubAllGlobals()
})

describe('native pinch normalization', () => {
  it('maps the cumulative scale and gesture phases', () => {
    const { container, host } = mountPinchHost()

    container.dispatchEvent(host, 'pinch', { scale: 1, state: 1, view: host })
    container.dispatchEvent(host, 'pinch', { scale: 1.75, state: 2, view: host })
    container.dispatchEvent(host, 'pinch', { scale: 2, state: 3, view: host })

    expect(events.map((e) => [e.scale, e.state])).toEqual([
      [1, 'began'],
      [1.75, 'moved'],
      [2, 'ended'],
    ])
    expect(events[0]!.target).toBe(host)
  })

  it('maps cancellation and tolerates missing scale', () => {
    const { container, host } = mountPinchHost()

    container.dispatchEvent(host, 'pinch', { scale: 1.4, state: 0, object: host })
    container.dispatchEvent(host, 'pinch', { state: 2, object: host })

    expect(events[0]).toMatchObject({ scale: 1.4, state: 'cancelled', target: host })
    expect(events[1]).toMatchObject({ scale: 1, state: 'moved' })
  })

  it('leaves the prop unset without a callback', () => {
    const container = createObjectContainer('nativescript')
    const root = createUniversalRoot(container, createObjectDriver('nativescript'))
    root.render(BareHost, {})
    expect(() =>
      container.dispatchEvent(container.children[0], 'pinch', { scale: 1, state: 1 }),
    ).toThrow(/no "pinch" listener/)
  })
})
