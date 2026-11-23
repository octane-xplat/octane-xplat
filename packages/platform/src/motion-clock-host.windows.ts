interface WindowsMotionRuntime {
  dotnet: {
    invoke(assembly: string, type: string, method: string, args: unknown[]): unknown
    asDelegate(type: string, callback: () => void): object
  }
}

const scheduler = 'OctaneXplat.Platform.UiScheduler'
let nextFrame = 0
const frames = new Map<number, () => void>()
let cancelTick: (() => void) | undefined

function runtime() {
  const { NSWinRT } = globalThis as typeof globalThis & { NSWinRT: WindowsMotionRuntime }

  return NSWinRT.dotnet
}

export const isMotionHost: boolean = true

export function realNow(): number {
  return Number(runtime().invoke('', scheduler, 'MonotonicNow', []))
}

export function wake(callback: () => void, milliseconds: number): () => void {
  const host = runtime()
  const observer = host.asDelegate('OctaneXplat.Platform.TimerCallback', callback)
  const token = host.invoke('', scheduler, 'Schedule', [milliseconds, observer])

  return () => {
    host.invoke('', scheduler, 'CancelTimer', [token])
  }
}

function tick() {
  cancelTick = undefined
  for (const [id, callback] of [...frames]) {
    if (frames.delete(id)) {
      try {
        callback()
      } catch (error) {
        console.error('[windows-animation-frame] callback failed', error)
      }
    }
  }
}

export function requestFrame(callback: () => void): number {
  const id = ++nextFrame

  cancelTick ??= wake(tick, 16)
  frames.set(id, callback)
  return id
}

export function cancelFrame(id: number): void {
  frames.delete(id)
  if (!frames.size) {
    cancelTick?.()
    cancelTick = undefined
  }
}
