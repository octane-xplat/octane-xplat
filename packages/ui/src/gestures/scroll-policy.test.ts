import { expect, it } from 'vitest'
import {
  createScrollPolicyRegistry,
  suspendedScroll,
  unrestrictedScroll,
  type ScrollPolicy,
} from './scroll-policy'

it('sets each nested viewport policy, including viewports mounted while locked', () => {
  const parents = new Map<object, object>()
  const root = {},
    outside = {},
    a = {},
    b = {},
    later = {}

  parents.set(a, root)
  parents.set(b, a)
  parents.set(later, b)

  const registry = createScrollPolicyRegistry<object>((ancestor, descendant) => {
    for (let host: object | undefined = descendant; host; host = parents.get(host)) {
      if (host === ancestor) {
        return true
      }
    }

    return false
  })

  const policies = new Map<object, ScrollPolicy>()
  const viewport = (host: object) => ({
    host,
    apply(policy: ScrollPolicy) {
      policies.set(host, policy)
    },
  })

  const offA = registry.register(viewport(a)),
    offB = registry.register(viewport(b)),
    offOutside = registry.register(viewport(outside))

  const drag = registry.reserve(root, { x: false, y: true, pinch: true })

  expect(policies.get(a)).toEqual({ x: false, y: true, pinch: true })
  expect(policies.get(b)).toEqual(policies.get(a))
  expect(policies.get(outside)).toEqual(unrestrictedScroll)

  const scope = registry.reserve(a, suspendedScroll)
  const offLater = registry.register(viewport(later))

  expect(policies.get(later)).toEqual(suspendedScroll)
  drag.release()
  expect(policies.get(a)).toEqual(suspendedScroll)
  scope.release()
  scope.release()
  expect(policies.get(b)).toEqual(unrestrictedScroll)
  offLater()
  offA()
  offB()
  offOutside()
})

it('retains independent reservations through live updates and committed reparenting', () => {
  const root = {},
    viewportHost = {}

  let nested = true,
    policy = unrestrictedScroll

  const registry = createScrollPolicyRegistry<object>(
    (ancestor, descendant) => ancestor === descendant || (nested && ancestor === root),
  )

  const off = registry.register({
    host: viewportHost,
    apply(next) {
      policy = next
    },
  })

  const a = registry.reserve(root, { x: false, y: true, pinch: true })
  const b = registry.reserve(root, { x: true, y: false, pinch: true })

  expect(policy).toEqual({ x: false, y: false, pinch: true })
  a.update(unrestrictedScroll)
  expect(policy).toEqual({ x: true, y: false, pinch: true })
  nested = false
  registry.refresh()
  expect(policy).toEqual(unrestrictedScroll)
  a.release()
  b.release()
  off()
})
