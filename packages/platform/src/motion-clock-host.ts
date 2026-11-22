import { requestAnimationFrame, cancelAnimationFrame } from '@nativescript/core/animation-frame'

const platform = globalThis as typeof globalThis & {
  CACurrentMediaTime?: () => number
  java?: { lang?: { System?: { nanoTime(): number } } }
}

export const isMotionHost: boolean = true

export function realNow(): number {
  if (platform.CACurrentMediaTime) {
    return platform.CACurrentMediaTime() * 1000
  }

  if (platform.java?.lang?.System) {
    return Number(platform.java.lang.System.nanoTime()) / 1e6
  }

  return typeof performance === 'undefined' ? Date.now() : performance.now()
}

export const requestFrame = (callback: () => void): number => requestAnimationFrame(callback)
export const cancelFrame = (id: number): void => cancelAnimationFrame(id)
export function wake(callback: () => void, milliseconds: number): () => void {
  const id = setTimeout(callback, milliseconds)

  return () => clearTimeout(id)
}
