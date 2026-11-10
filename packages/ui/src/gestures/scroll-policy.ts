/** Allowed native/browser manipulation; restrictions intersect, never override each other. */
export interface ScrollPolicy {
  readonly x: boolean
  readonly y: boolean
  readonly pinch: boolean
}

export const unrestrictedScroll: ScrollPolicy = Object.freeze({ x: true, y: true, pinch: true })
export const suspendedScroll: ScrollPolicy = Object.freeze({ x: false, y: false, pinch: false })

export interface ManagedViewport<Host> {
  readonly host: Host
  apply(policy: ScrollPolicy): void
}

/** Reservations are independent of layout/overflow and apply at every nested viewport. */
export function createScrollPolicyRegistry<Host>(
  contains: (ancestor: Host, descendant: Host) => boolean,
) {
  const viewports = new Set<ManagedViewport<Host>>()
  const reservations = new Set<{ host: Host; policy: ScrollPolicy }>()
  function update(viewport: ManagedViewport<Host>) {
    let x = true,
      y = true,
      pinch = true

    for (const reservation of reservations) {
      if (!contains(reservation.host, viewport.host)) {
        continue
      }

      x &&= reservation.policy.x
      y &&= reservation.policy.y
      pinch &&= reservation.policy.pinch
    }

    viewport.apply({ x, y, pinch })
  }

  function refresh() {
    for (const viewport of viewports) {
      update(viewport)
    }
  }

  return {
    register(viewport: ManagedViewport<Host>) {
      viewports.add(viewport)
      try {
        update(viewport)
      } catch (error) {
        viewports.delete(viewport)
        throw error
      }

      let alive = true

      return () => {
        if (!alive) {
          return
        }

        alive = false
        viewports.delete(viewport)
        viewport.apply(unrestrictedScroll)
      }
    },
    reserve(host: Host, policy: ScrollPolicy) {
      const reservation = { host, policy }

      reservations.add(reservation)
      try {
        refresh()
      } catch (error) {
        reservations.delete(reservation)
        refresh()
        throw error
      }

      let alive = true

      return {
        update(next: ScrollPolicy) {
          if (!alive) {
            return
          }

          const previous = reservation.policy

          reservation.policy = next
          try {
            refresh()
          } catch (error) {
            reservation.policy = previous
            refresh()
            throw error
          }
        },
        release() {
          if (!alive) {
            return
          }

          alive = false
          reservations.delete(reservation)
          refresh()
        },
      }
    },
    /** Re-evaluate ancestry after committed reparenting. */
    refresh,
  }
}

export type ScrollPolicyRegistry<Host> = ReturnType<typeof createScrollPolicyRegistry<Host>>
