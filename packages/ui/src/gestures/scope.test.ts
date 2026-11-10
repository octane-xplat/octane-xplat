import { expect, it } from 'vitest'
import { createScope } from 'octane/signals'
import { createInteractionScope } from './scope'

it('acquires once for overlapping leases and restores only after the final release', () => {
  const owner = createScope({ scopeKey: 'scope-test' }),
    value$ = owner.signal$('suspended', false)

  const controller = createInteractionScope(
    value$,
    owner.derived$('readonly', () => value$.get()),
  )

  let freezes = 0,
    restores = 0

  expect(controller.handle.suspend()).toEqual({ ok: false, reason: 'detached' })

  const detach = controller.attach({
    freeze() {
      freezes++
      return {
        ok: true,
        release() {
          restores++
        },
      }
    },
  })

  const first = controller.handle.suspend(),
    second = controller.handle.suspend()

  expect(first.ok && second.ok).toBe(true)
  if (!first.ok || !second.ok) {
    throw new Error('Expected leases')
  }

  expect(freezes).toBe(1)
  first.lease.release()
  first.lease.release()
  expect(controller.handle.suspended$.get()).toBe(true)
  expect(restores).toBe(0)
  second.lease.release()
  expect(controller.handle.suspended$.get()).toBe(false)
  expect(restores).toBe(1)
  detach()
  controller.dispose()
  owner.dispose()
})

it('does not publish suspension after unsupported preflight or detach during native cancellation', () => {
  const owner = createScope({ scopeKey: 'scope-failure' }),
    value$ = owner.signal$('suspended', false)

  const controller = createInteractionScope(
    value$,
    owner.derived$('readonly', () => value$.get()),
  )

  const detach = controller.attach({
    freeze() {
      return { ok: false, reason: 'unsupported' }
    },
  })

  expect(controller.handle.suspend()).toEqual({ ok: false, reason: 'unsupported' })
  expect(value$.get()).toBe(false)
  detach()

  let restored = 0
  let release = () => {}

  release = controller.attach({
    freeze() {
      release()
      return {
        ok: true,
        release() {
          restored++
        },
      }
    },
  })

  expect(controller.handle.suspend()).toEqual({ ok: false, reason: 'detached' })
  expect(restored).toBe(1)
  expect(value$.get()).toBe(false)
  controller.dispose()
  owner.dispose()
})

it('retires active leases without attempting signal writes after their owner has retired', () => {
  const owner = createScope({ scopeKey: 'scope-retire' }),
    value$ = owner.signal$('suspended', false)

  const controller = createInteractionScope(
    value$,
    owner.derived$('readonly', () => value$.get()),
  )

  let restored = 0

  controller.attach({
    freeze() {
      return {
        ok: true,
        release() {
          restored++
        },
      }
    },
  })

  const result = controller.handle.suspend()

  expect(result.ok).toBe(true)
  owner.dispose()
  expect(restored).toBe(1)
  if (result.ok) {
    result.lease.release()
  }

  controller.dispose()
  expect(restored).toBe(1)
})

it('rejects acquisition during restoration and never reacquires a detached driver from a subscriber', () => {
  const owner = createScope({ scopeKey: 'scope-reentrant' }),
    value$ = owner.signal$('suspended', false)

  const controller = createInteractionScope(
    value$,
    owner.derived$('readonly', () => value$.get()),
  )

  const attempts: unknown[] = []
  const detach = controller.attach({
    freeze() {
      return {
        ok: true,
        release() {
          attempts.push(controller.handle.suspend())
        },
      }
    },
  })

  const first = controller.handle.suspend()

  if (!first.ok) {
    throw new Error('Expected a lease')
  }

  first.lease.release()
  expect(attempts).toEqual([{ ok: false, reason: 'busy' }])

  const second = controller.handle.suspend()

  if (!second.ok) {
    throw new Error('Expected a lease')
  }

  const off = value$.subscribe(() => {
    if (!value$.get()) {
      attempts.push(controller.handle.suspend())
    }
  })

  detach()
  expect(attempts.slice(1)).toEqual([
    { ok: false, reason: 'detached' },
    { ok: false, reason: 'detached' },
  ])

  second.lease.release()
  off()
  controller.dispose()
  owner.dispose()
})

it('returns detached after a suspension subscriber synchronously unmounts the scope', () => {
  const owner = createScope({ scopeKey: 'scope-unmount-on-suspend' }),
    value$ = owner.signal$('suspended', false)

  const controller = createInteractionScope(
    value$,
    owner.derived$('readonly', () => value$.get()),
  )

  let restored = 0

  controller.attach({
    freeze() {
      return {
        ok: true,
        release() {
          restored++
        },
      }
    },
  })

  value$.subscribe(() => {
    if (value$.get()) {
      controller.dispose()
    }
  })

  expect(controller.handle.suspend()).toEqual({ ok: false, reason: 'detached' })
  expect(restored).toBe(1)
  expect(value$.get()).toBe(false)
  owner.dispose()
})

it('rejects uncovered portal ownership before mutation and rejects newly uncovered members during a lease', () => {
  const owner = createScope({ scopeKey: 'scope-coverage' }),
    state$ = owner.signal$('state', false)

  const controller = createInteractionScope(
    state$,
    owner.derived$('read', () => state$.get()),
  )

  const inside = {},
    outside = {}

  let freezes = 0
  const detach = controller.attach({
    covers: (host) => host === inside,
    freeze() {
      freezes++
      return { ok: true, release() {} }
    },
  })

  const leave = controller.registerMember(outside)

  expect(controller.handle.suspend()).toEqual({ ok: false, reason: 'unsupported' })
  expect(freezes).toBe(0)
  leave()

  const leaveInside = controller.registerMember(inside)
  const result = controller.handle.suspend()

  expect(result.ok).toBe(true)
  expect(() => controller.registerMember(outside)).toThrow('portal cannot enter')
  if (result.ok) {
    result.lease.release()
  }

  leaveInside()
  detach()
  controller.dispose()
  owner.dispose()
})
