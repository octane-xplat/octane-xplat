/// <reference path="./globals.d.ts" />
import { openDevChannel, type DevChannel } from '@octane-xplat/devtools/app'
import type {
  AppToServer,
  ServerToApp,
  ServerToAppStyles,
  StyleValue,
  TweakValue,
} from './protocol'

// __OCTANE_TWEAKS__ is declared in globals.d.ts and substituted with `true` by
// @octane-xplat/tweaks/vite in dev only. Absent in production and whenever the
// plugin is not installed — the client then stays inert and useTweak returns
// its literal argument.

interface Mounted {
  // The value this client reports on (re)connect: the hook's literal argument.
  value: TweakValue
  count: number
  listeners: Set<(override: TweakValue | null) => void>
}

// Module-singleton client shared by every useTweak call in the app. One
// devtools channel ('tweaks' v5), per-id refcounted mounts, mount/unmount
// batching on a microtask, and a full mount re-send on every live transition
// (the hub routes reconnects; there is no app-side backoff anymore).
class Client {
  private mounted = new Map<string, Mounted>()
  private channel: DevChannel<ServerToApp, AppToServer> | null = null
  private pendingMounts = new Map<string, TweakValue>()
  private pendingUnmounts = new Set<string>()
  private flushQueued = false
  // Last 'values' map from the backend. Cached so a hook that (re)mounts — or
  // a second instance of an already-mounted id — receives the live override
  // immediately instead of showing its literal until the next broadcast.
  private overrides = new Map<string, TweakValue>()
  private styles: ServerToAppStyles = {}
  private styleListeners = new Set<() => void>()
  private pickListeners = new Set<(active: boolean) => void>()
  private hasValues = false

  watch(id: string, value: TweakValue, listener: (override: TweakValue | null) => void) {
    let entry = this.mounted.get(id)

    if (entry) {
      entry.count++
      entry.listeners.add(listener)
    } else {
      entry = { value, count: 1, listeners: new Set([listener]) }
      this.mounted.set(id, entry)
      this.pendingMounts.set(id, value)
      this.pendingUnmounts.delete(id)
      this.connect()
    }

    // Deliver the currently-known override to the new watcher (no-op when no
    // values message has arrived yet).
    if (this.hasValues) {
      listener(this.overrides.get(id) ?? null)
    }

    this.queueFlush()
    return () => {
      const current = this.mounted.get(id)

      if (!current) {
        return
      }

      current.listeners.delete(listener)
      if (--current.count > 0) {
        return
      }

      this.mounted.delete(id)
      this.pendingMounts.delete(id)
      this.pendingUnmounts.add(id)
      this.queueFlush()
    }
  }

  private queueFlush() {
    if (this.flushQueued) {
      return
    }

    this.flushQueued = true
    queueMicrotask(() => {
      this.flushQueued = false
      if (!this.channel) {
        this.pendingMounts.clear()
        this.pendingUnmounts.clear()
        return
      }

      this.sendPending()
    })
  }

  private sendPending() {
    if (this.pendingMounts.size) {
      const mounts = [...this.pendingMounts].map(([id, value]) => ({ id, value }))

      this.send({ type: 'mount', mounts })
      this.pendingMounts.clear()
    }

    if (this.pendingUnmounts.size) {
      this.send({ type: 'unmount', ids: [...this.pendingUnmounts] })
      this.pendingUnmounts.clear()
    }
  }

  private connect() {
    if (typeof __OCTANE_TWEAKS__ === 'undefined' || __OCTANE_TWEAKS__ !== true) {
      return
    }

    if (this.channel) {
      return
    }

    const channel = openDevChannel<ServerToApp, AppToServer>('tweaks', 5)

    this.channel = channel
    channel.onStateChange((state) => {
      if (state !== 'live' || this.channel !== channel) {
        return
      }

      // Re-send the full mounted set on every (re)connect — what the old
      // socket's onopen did.
      if (this.mounted.size) {
        this.send({
          type: 'mount',
          mounts: [...this.mounted].map(([id, e]) => ({ id, value: e.value })),
        })
      }

      this.sendPending()
    })

    channel.subscribe((message) => {
      if (message.from !== 'backend') {
        return
      }

      const data = message.data

      if (data.type === 'pick') {
        for (const l of this.pickListeners) {
          l(data.active)
        }

        return
      }

      if (data.type !== 'values') {
        return
      }

      this.overrides = new Map(Object.entries(data.values))
      this.styles = data.styles ?? {}
      for (const l of this.styleListeners) {
        l()
      }

      this.hasValues = true
      for (const [id, entry] of this.mounted) {
        const override = this.overrides.get(id) ?? null

        for (const listener of entry.listeners) {
          listener(override)
        }
      }
    })
  }

  private send(message: AppToServer) {
    try {
      this.channel?.send('backend', message)
    } catch {
      // A dying channel surfaces through its state; sending must never throw
      // into user render code.
    }
  }
  // Style sites mount/unmount through the same refcounted machinery; they
  // carry no runtime value, so mount reports a 0 placeholder.
  mountStyle(id: string) {
    this.connect()

    const entry = this.mounted.get(id)

    if (entry) {
      entry.count++
    } else {
      this.mounted.set(id, { value: 0, count: 1, listeners: new Set() })
      this.pendingMounts.set(id, 0)
    }

    this.queueFlush()
  }

  unmountStyle(id: string) {
    const entry = this.mounted.get(id)

    if (!entry) {
      return
    }

    if (--entry.count <= 0) {
      this.mounted.delete(id)
      this.pendingUnmounts.add(id)
    }

    this.queueFlush()
  }

  getStyle(id: string): { set: Record<string, StyleValue>; delete: string[] } | null {
    const s = this.styles[id]

    return s && s.kind === 'inline' ? s : null
  }

  getStyleRaw(id: string) {
    return this.styles[id] ?? null
  }

  // Click-to-pick: web installs a listener (native leaves none — the
  // messages are ignored there). Returns an unsubscribe.
  // No connect() here: pick listeners only matter once a site mounted and
  // opened the channel; registering must not open one on module eval.
  onPick(listener: (active: boolean) => void) {
    this.pickListeners.add(listener)
    return () => this.pickListeners.delete(listener)
  }
  sendPicked(ids: string[]) {
    this.send({ type: 'picked', ids })
  }

  onStyles(listener: () => void): () => void {
    this.styleListeners.add(listener)
    return () => this.styleListeners.delete(listener)
  }
}

export const client = new Client()
