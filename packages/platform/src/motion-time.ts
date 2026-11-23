export interface MotionTimeHost {
  now(): number
  wake(callback: () => void, milliseconds: number): () => void
}

export function isMotionRate(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && value <= 1
}

export interface MotionTime {
  now(): number
  schedule(callback: () => void, milliseconds: number): () => void
  getRate(): number
  setRate(rate: number): void
  subscribe(listener: (rate: number) => void): () => void
}

export function createMotionTime(host: MotionTimeHost, initialRate = 1): MotionTime {
  if (!isMotionRate(initialRate)) {
    throw new RangeError('Motion rate must be greater than 0 and at most 1.')
  }

  let rate = initialRate
  let realOrigin: number | undefined
  let motionOrigin = 0
  const timers = new Set<() => void>()
  const listeners = new Set<(rate: number) => void>()

  function now() {
    const real = host.now()

    return motionOrigin + (real - (realOrigin ?? 0)) * rate
  }

  function setRate(next: number) {
    if (!isMotionRate(next)) {
      throw new RangeError('Motion rate must be greater than 0 and at most 1.')
    }

    if (rate === next) {
      return
    }

    const real = host.now()

    motionOrigin += (real - (realOrigin ?? 0)) * rate
    realOrigin = real
    rate = next
    for (const rearm of timers) {
      rearm()
    }

    for (const listener of listeners) {
      listener(rate)
    }
  }

  function schedule(callback: () => void, milliseconds: number) {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) {
      throw new RangeError('Motion timer delay must be finite and nonnegative.')
    }

    const deadline = now() + milliseconds
    let cancelWake: (() => void) | undefined
    let generation = 0

    function arm() {
      const previousWake = cancelWake
      const remaining = Math.max(0, deadline - now())
      const ticket = generation + 1

      cancelWake = host.wake(
        () => {
          if (ticket === generation) {
            check()
          }
        },
        Math.min(2_147_483_647, Math.ceil(remaining / rate)),
      )

      generation = ticket
      previousWake?.()
    }

    function cancel() {
      timers.delete(arm)
      cancelWake?.()
      cancelWake = undefined
    }

    function check() {
      if (!timers.has(arm)) {
        return
      }

      cancelWake = undefined
      if (now() < deadline) {
        arm()
        return
      }

      cancel()
      callback()
    }

    timers.add(arm)
    try {
      arm()
    } catch (error) {
      cancel()
      throw error
    }

    return cancel
  }

  return {
    now,
    schedule,
    getRate: () => rate,
    setRate,
    subscribe(listener: (rate: number) => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
