interface Win32Arg {
  type: string
  value: number | string
}

interface Win32Surface {
  call(dll: string, fn: string, ret: string, ...args: Win32Arg[]): unknown
}

interface NsInterop {
  pointerFromBuffer(buf: ArrayBuffer | ArrayBufferView): unknown
  pointerKey(value: unknown): string | number
}

interface NsWinRtLike {
  win32?: Win32Surface
  interop?: NsInterop
}

export interface WorkerLike {
  postMessage(data: unknown): void
  onmessage: ((event: { data: unknown }) => void) | null
  terminate(): void
}

type WorkerCtor = new (source: string, options: { eval: boolean }) => WorkerLike

export const projection = () => globalThis as { NSWinRT?: NsWinRtLike; Worker?: WorkerCtor }

export const u32 = (value: number): Win32Arg => ({ type: 'u32', value })
export const i32 = (value: number): Win32Arg => ({ type: 'i32', value })
export const ptr = (value: number | bigint): Win32Arg => ({
  type: 'pointer',
  value: typeof value === 'bigint' ? Number(value) : value,
})

export const call = (dll: string, fn: string, ret: string, ...args: Win32Arg[]) =>
  projection().NSWinRT!.win32!.call(dll, fn, ret, ...args)

export const bufferAddress = (buf: ArrayBuffer | ArrayBufferView): number => {
  const interop = projection().NSWinRT!.interop!
  const p = interop.pointerFromBuffer(buf)

  return typeof p === 'number' ? p : Number(interop.pointerKey(p))
}
