/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalSync,
} from 'octane/universal/native'

import { Pressable } from '../../components/actions/Pressable.macos.tsrx'
import { View } from '../../components/layout/View.macos.tsrx'
import type { InputFrame } from '../../gestures/owner'
import type { ActivationEvent, PanNotification } from '../../gestures/types'

afterEach(() => vi.unstubAllGlobals())

it('coordinates public AppKit pan and semantic press bindings without observer churn on handler updates', () => {
  const window = {},
    observers = new Map<object, (frame: InputFrame, identity: string) => void>()

  const activations = new Map<
    object,
    (source: ActivationEvent['source'], kind?: 'double' | 'long') => void
  >()

  let observed = 0,
    removed = 0,
    time = 0

  vi.stubGlobal('__xplatAppKit', {
    gestureSurface(host: object) {
      return {
        root: window,
        host,
        local: (p: object) => p,
        freeze: () => (p: object) => p,
        containsPoint: () => true,
        containsHost: (other: object) => other === host,
        observe(callback: (frame: InputFrame, identity: string) => void) {
          observed++
          observers.set(host, callback)
          return () => {
            removed++
            observers.delete(host)
          }
        },
      }
    },
    observeGestureActivation(
      host: object,
      callback: (source: ActivationEvent['source'], kind?: 'double' | 'long') => void,
    ) {
      activations.set(host, callback)
      return () => activations.delete(host)
    },
  })

  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))
  const old = vi.fn(),
    latest = vi.fn(),
    press = vi.fn(),
    double = vi.fn()

  function Panel(props: { pan(event: PanNotification): void; disabled?: boolean }) {
    return (
      <View onPan={props.pan}>
        <Pressable disabled={props.disabled} onPress={press} onDoublePress={double}>
          Close
        </Pressable>
      </View>
    )
  }

  const render = (pan = latest, disabled = false) =>
    flushUniversalSync(() => root.render(Panel, { pan, disabled }))

  try {
    render(old)

    const panel = container.children[0],
      button = panel.children[0]

    const send = (type: InputFrame['type'], x: number) => {
      const contact = { id: 'mouse', kind: 'mouse' as const, window: { x, y: 10 }, screen: null }
      const frame: InputFrame = {
        type,
        time: (time += 20),
        contacts: type === 'up' ? [] : [contact],
        changed: contact,
        hitPath: [button, panel],
      }

      flushUniversalSync(() => {
        for (const callback of observers.values()) {
          callback(frame, String(time))
        }
      })
    }

    send('down', 10)
    render()
    expect(observed).toBe(2)
    expect(removed).toBe(0)
    send('move', 40)
    send('up', 40)
    expect(old).not.toHaveBeenCalled()
    expect(latest.mock.calls.map(([event]) => event.phase)).toEqual(['start', 'update', 'finish'])
    expect(press).not.toHaveBeenCalled()
    send('down', 40)
    send('up', 40)
    expect(press).toHaveBeenCalledOnce()
    expect(press.mock.calls[0][0]).toMatchObject({
      source: 'pointer',
      pointer: { pointerCount: 0 },
    })

    activations.get(button)!('pointer', 'double')
    expect(double).toHaveBeenCalledOnce()
    activations.get(button)!('accessibility')
    expect(press.mock.calls.at(-1)![0]).toMatchObject({ source: 'accessibility', pointer: null })
    render(latest, true)
    activations.get(button)!('keyboard')
    expect(press).toHaveBeenCalledTimes(2)
    root.unmount()
    expect(removed).toBe(observed)
    expect(activations.size).toBe(0)
  } finally {
    root.unmount()
  }
})
