/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalSync,
} from 'octane/universal/native'

import { createScope } from 'octane/signals'
import { InteractionScopeProvider, useInteractionMembership } from './context.tsrx'
import { createInteractionScope } from './scope'
import type { InteractionScope } from './types'

function Member(props: { host: object }) @{
  const bind = useInteractionMembership()

  <masonview ref={(view: object | null) => bind(view ? props.host : null)} />
}

function Scoped(props: { scope: InteractionScope; host: object }) @{
  <InteractionScopeProvider scope={props.scope}>
    <Member host={props.host} />
  </InteractionScopeProvider>
}

it('tracks committed native context membership through ref replacement and removes it on unmount', async () => {
  const signals = createScope({ scopeKey: 'native-context-membership' }),
    state$ = signals.signal$('suspended', false)

  const scope = createInteractionScope(
    state$,
    signals.derived$('read', () => state$.get()),
  )

  const inside = {},
    outside = {}

  let freezes = 0
  const detach = scope.attach({
    covers: (host) => host === inside,
    freeze() {
      freezes++
      return { ok: true, release() {} }
    },
  })

  const root = createUniversalRoot(
    createObjectContainer('nativescript'),
    createObjectDriver('nativescript'),
  )

  try {
    flushUniversalSync(() => root.render(Scoped, { scope: scope.handle, host: inside }))
    await Promise.resolve()

    const lease = scope.handle.suspend()

    expect(lease.ok).toBe(true)
    if (lease.ok) {
      lease.lease.release()
    }

    flushUniversalSync(() => root.render(Scoped, { scope: scope.handle, host: outside }))
    await Promise.resolve()
    expect(scope.handle.suspend()).toEqual({ ok: false, reason: 'unsupported' })
    expect(freezes).toBe(1)
    flushUniversalSync(() => root.unmount())

    const after = scope.handle.suspend()

    expect(after.ok).toBe(true)
    if (after.ok) {
      after.lease.release()
    }
  } finally {
    root.unmount()
    detach()
    scope.dispose()
    signals.dispose()
  }
})
