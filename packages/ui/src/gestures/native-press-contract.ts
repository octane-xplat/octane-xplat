import type { PressOptions } from './press'

export type NativePressTransport = {
  commit(options: PressOptions): void
  dispose(): void
}
