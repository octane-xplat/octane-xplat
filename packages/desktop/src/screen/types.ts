export interface DesktopRectangle {
  x: number
  y: number
  width: number
  height: number
}

export interface DesktopDisplay {
  /** Identifier for the connected display in the current session. */
  id: string
  bounds: DesktopRectangle
  /** Usable desktop area, when the host exposes it. */
  workArea?: DesktopRectangle
  /** Ratio of physical pixels to logical units. */
  scaleFactor: number
  /** Whether the operating system identifies this display as primary. */
  isPrimary: boolean
}

export type DesktopDisplayMetric = 'bounds' | 'workArea' | 'scaleFactor' | 'isPrimary'

export interface DesktopDisplayEvent {
  readonly type: keyof DesktopScreenEvents
}

export interface DesktopScreenEvents {
  'display-added': (event: DesktopDisplayEvent, display: DesktopDisplay) => void
  'display-removed': (event: DesktopDisplayEvent, display: DesktopDisplay) => void
  'display-metrics-changed': (
    event: DesktopDisplayEvent,
    display: DesktopDisplay,
    changedMetrics: readonly DesktopDisplayMetric[],
  ) => void
}

export interface DesktopScreen {
  readonly supported: boolean
  /** Desktop coordinates use a top-left origin and positive Y down. */
  readonly coordinateSpace: 'logical' | 'physical'
  getAllDisplays(): DesktopDisplay[]
  getPrimaryDisplay(): DesktopDisplay | undefined
  /** Returns the display with the greatest overlap, or the nearest display. */
  getDisplayMatching(bounds: DesktopRectangle): DesktopDisplay | undefined
  /** Listen for changes after subscribing. Returns this screen. */
  on<Event extends keyof DesktopScreenEvents>(event: Event, listener: DesktopScreenEvents[Event]): this
  /** Remove the most recent registration of this listener. */
  off<Event extends keyof DesktopScreenEvents>(event: Event, listener: DesktopScreenEvents[Event]): this
}
