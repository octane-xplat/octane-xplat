export const isMotionHost: boolean = typeof window !== 'undefined'

export const realNow = (): number => performance.now()
export const requestFrame = (callback: () => void): number => requestAnimationFrame(callback)
export const cancelFrame = (id: number): void => cancelAnimationFrame(id)
export function wake(callback: () => void, milliseconds: number): () => void {
  const id = setTimeout(callback, milliseconds)

  return () => clearTimeout(id)
}
