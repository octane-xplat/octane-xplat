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

export interface DesktopScreen {
  readonly supported: boolean
  /** Desktop coordinates use a top-left origin and positive Y down. */
  readonly coordinateSpace: 'logical' | 'physical'
  getAllDisplays(): DesktopDisplay[]
  getPrimaryDisplay(): DesktopDisplay | undefined
  /** Returns the display with the greatest overlap, or the nearest display. */
  getDisplayMatching(bounds: DesktopRectangle): DesktopDisplay | undefined
}
