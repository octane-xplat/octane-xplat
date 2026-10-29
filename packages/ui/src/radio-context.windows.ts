import { createContext } from 'octane'
import type { WindowsRadioGroup } from './radio-control.windows'

export const WindowsRadioContext = createContext<WindowsRadioGroup | null>(null)
export const WindowsRadioProvider: any = WindowsRadioContext
