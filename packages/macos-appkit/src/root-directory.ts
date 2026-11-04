import type { NSView } from '@octane-xplat/platform/macos'
import type { UniversalRoot } from 'octane/universal/native'
import type { RootContainer } from './model'
import { FailureCollector } from './failures'
import {
  observeLayoutCommits as subscribeLayoutCommits,
  type LayoutCommit,
} from './layout-observers'

/** Membership observers acquire a release for this exact container. */
export type RootMembershipObserver = (container: RootContainer) => void | (() => void)

export interface RootDirectoryReader {
  containers(): readonly RootContainer[]
  hasHost(host: NSView): boolean
  fontFamilyForView(view: NSView | undefined): string | undefined
  observe(observer: RootMembershipObserver): () => void
  observeLayoutCommits(observer: (commit: LayoutCommit) => void): () => void
}

export interface RootDirectoryWriter {
  register(container: RootContainer): () => void
  rootForHost(host: NSView): UniversalRoot | undefined
}

export type RootDirectory = ReturnType<typeof createRootDirectory>

/** Collections never escape. Only root lifecycle receives the writer. */
export function createRootDirectory() {
  const members = new Set<RootContainer>()
  const hosts = new WeakMap<NSView, RootContainer>()
  const observers = new Set<Map<RootContainer, () => void>>()
  const callbacks = new WeakMap<Map<RootContainer, () => void>, RootMembershipObserver>()

  function visit(records: Map<RootContainer, () => void>, container: RootContainer) {
    // Reserve before user code: reentrant retirement/unsubscription is safe.
    const reservation = () => {}
    records.set(container, reservation)
    const release = callbacks.get(records)!(container) ?? (() => {})
    if (
      records.get(container) === reservation &&
      members.has(container) &&
      observers.has(records)
    ) {
      records.set(container, release)
    } else {
      release()
    }
  }

  function releaseRecords(records: Map<RootContainer, () => void>) {
    const releases = [...records.values()]
    records.clear()
    const failures = new FailureCollector()
    for (const release of releases) {
      failures.run('root observation', release)
    }
    failures.throwIfFailed()
  }

  function observe(observer: RootMembershipObserver): () => void {
    const records = new Map<RootContainer, () => void>()
    callbacks.set(records, observer)
    observers.add(records)
    const stop = () => {
      observers.delete(records)
      releaseRecords(records)
    }
    try {
      const current = [...members]
      for (const container of current) {
        if (members.has(container) && observers.has(records)) {
          visit(records, container)
        }
      }
    } catch (error) {
      const failures = new FailureCollector()
      failures.run('root observation setup', () => {
        throw error
      })
      failures.run('root observation unwind', stop)
      failures.throwIfFailed()
    }
    return stop
  }

  function register(container: RootContainer): () => void {
    const host = container.hostView
    if (hosts.has(host)) {
      throw new Error('AppKit host already has a live root')
    }
    hosts.set(host, container)
    members.add(container)
    let active = true
    const retire = () => {
      if (!active) {
        return
      }
      active = false
      members.delete(container)
      if (hosts.get(host) === container) {
        hosts.delete(host)
      }
      const failures = new FailureCollector()
      const current = [...observers]
      for (const records of current) {
        const release = records.get(container)
        records.delete(container)
        if (release) {
          failures.run('root observation retirement', release)
        }
      }
      failures.throwIfFailed()
    }
    try {
      const current = [...observers]
      for (const records of current) {
        if (active && observers.has(records)) {
          visit(records, container)
        }
      }
    } catch (error) {
      const failures = new FailureCollector()
      failures.run('root membership setup', () => {
        throw error
      })
      failures.run('root membership unwind', retire)
      failures.throwIfFailed()
    }
    return retire
  }

  const reader: RootDirectoryReader = {
    containers: () => [...members],
    hasHost: (host) => hosts.has(host),
    fontFamilyForView(view) {
      for (let current = view; current; current = current.superview ?? undefined) {
        const member = hosts.get(current)
        if (member) {
          return member.fontFamily
        }
      }
      return undefined
    },
    observe,
    observeLayoutCommits(observer) {
      const stop = subscribeLayoutCommits(observer)
      try {
        const current = [...members]
        for (const container of current) {
          observer({ hostView: container.hostView })
        }
      } catch (error) {
        stop()
        throw error
      }
      return stop
    },
  }
  const writer: RootDirectoryWriter = {
    register,
    rootForHost: (host) => hosts.get(host)?.root ?? undefined,
  }
  return { reader, writer }
}
