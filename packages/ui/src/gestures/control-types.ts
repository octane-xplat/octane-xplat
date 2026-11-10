import type { Point } from './types'

/** A built-in control needs measured movement, not native recognizer objects. */
export interface ControlPanNotification {
  readonly phase: 'start' | 'update' | 'finish'
  readonly translation: Point
  readonly startLocal: Point | null
  readonly positionLocal: Point | null
  readonly cancelled: boolean
}

export interface ControlPanOptions {
  readonly axis: 'x' | 'y' | 'both'
  readonly enabled: boolean
}
