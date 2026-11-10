interface FlagLease {
  count: number
  restore(): void
}

const owners = new WeakMap<object, Map<string, FlagLease>>()

/** Overlapping ancestor scopes restore a native flag only after its last owner leaves. */
export function leaseNativeFlag<Host extends object, Key extends keyof Host & string>(
  host: Host,
  key: Key,
  value: Host[Key],
): () => void {
  let flags = owners.get(host)

  if (!flags) {
    flags = new Map()
    owners.set(host, flags)
  }

  let lease = flags.get(key)

  if (lease) {
    lease.count++
  } else {
    const original = host[key]

    host[key] = value
    lease = {
      count: 1,
      restore() {
        if (host[key] === value) {
          host[key] = original
        }
      },
    }

    flags.set(key, lease)
  }

  const current = lease
  let alive = true

  return () => {
    if (!alive) {
      return
    }

    alive = false
    if (--current.count === 0) {
      flags!.delete(key)
      current.restore()
    }
  }
}
