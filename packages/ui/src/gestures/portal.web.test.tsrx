/** @jsxImportSource @octane-xplat/jsx/dom */
import { act, createRoot, useLayoutEffect } from 'octane'
import { expect, it } from 'vitest'
import { View } from '../components/layout/View.web.tsrx'
import { createPortal } from '../internal/platform/native-portal.web.tsrx'
import { useInteractionScope$ } from './hooks.tsrx'
import type { InteractionScope, SuspendResult } from './types'

it('registers an outside portal before a parent layout command tries to suspend', () => {
  const mount = document.createElement('div'),
    portal = document.createElement('div')

  document.body.append(mount, portal)

  const root = createRoot(mount)
  let scope: InteractionScope | undefined, result: SuspendResult | undefined
  function Content() {
    return createPortal(<input aria-label="Portal input" />, portal)
  }

  function Panel() {
    scope = useInteractionScope$()
    useLayoutEffect(() => {
      result = scope!.suspend()
    }, [])

    return (
      <View interactionScope={scope}>
        <Content />
      </View>
    )
  }

  try {
    act(() => root.render(<Panel />))
    expect(portal.querySelector('input')).not.toBeNull()
    expect(result).toEqual({ ok: false, reason: 'unsupported' })
    expect(scope!.suspended$.get()).toBe(false)
    expect(mount.firstElementChild!.hasAttribute('inert')).toBe(false)
  } finally {
    act(() => root.unmount())
    mount.remove()
    portal.remove()
  }
})

it('restores a mounted input-only scope lease', () => {
  const mount = document.createElement('div')

  document.body.append(mount)

  const root = createRoot(mount)
  let scope: InteractionScope | undefined
  function Panel() {
    scope = useInteractionScope$()
    return (
      <View interactionScope={scope}>
        <span>Owned content</span>
      </View>
    )
  }

  try {
    act(() => root.render(<Panel />))

    Object.defineProperty(mount.firstElementChild!, 'inert', { value: false, writable: true })

    const result = scope!.suspend()

    expect(result.ok).toBe(true)
    if (result.ok) {
      result.lease.release()
      result.lease.release()
    }

    expect(scope!.suspended$.get()).toBe(false)
  } finally {
    act(() => root.unmount())
    mount.remove()
  }
})
