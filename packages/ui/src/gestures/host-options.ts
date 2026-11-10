import type { GestureHostProps } from './types'
import type { PressOptions } from './press'

export interface InteractionHostOptions extends GestureHostProps {
  readonly press?: PressOptions
  readonly viewport?: boolean
}
