import { createStore } from '@octane-xplat/ui/data'

/** Observable ownership, independent of child state, so teardown remains inspectable. */
export const fixtureResources = createStore(0)
export function acquireFixtureResource() {
  let released = false

  fixtureResources.update((n) => n + 1)
  return () => {
    if (released) {
      return
    }

    released = true
    fixtureResources.update((n) => n - 1)
  }
}
