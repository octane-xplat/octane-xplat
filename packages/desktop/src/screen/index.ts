import { createDesktopScreen } from './service.js'
import type { DesktopScreen } from './types.js'

export type * from './types.js'

export const screen: DesktopScreen = createDesktopScreen('logical', () => false, () => [])
