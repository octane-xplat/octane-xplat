import Gdk from 'gi://Gdk?version=4.0'
import { createDesktopScreen } from './service.js'
import type { DesktopDisplay, DesktopScreen } from './types.js'

export type * from './types.js'

let ids = new Map<Gdk.Monitor, string>()
let nextId = 0

export const screen: DesktopScreen = createDesktopScreen(
  'logical',
  () => Gdk.Display.get_default() !== null,
  () => {
    const display = Gdk.Display.get_default()
    if (!display) return []

    const monitors = display.get_monitors()
    const primary = display.get_primary_monitor?.()
    const result: DesktopDisplay[] = []
    const connected = new Map<Gdk.Monitor, string>()
    for (let index = 0; index < monitors.get_n_items(); index++) {
      const monitor = monitors.get_item(index)
      if (!monitor) continue
      const id = ids.get(monitor) ?? String(++nextId)
      connected.set(monitor, id)
      const { x, y, width, height } = monitor.get_geometry()
      result.push({
        id,
        bounds: { x, y, width, height },
        scaleFactor: monitor.get_scale?.() ?? monitor.get_scale_factor(),
        isPrimary: monitor === primary,
      })
    }
    ids = connected
    return result
  },
)
