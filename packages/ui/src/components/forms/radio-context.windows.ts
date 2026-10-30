import { createContext, type Context } from 'octane'
import type { WindowsRadioGroup } from './radio-control.windows'

export const WindowsRadioContext: Context<WindowsRadioGroup | null> =
	createContext<WindowsRadioGroup | null>(null)

export const WindowsRadioProvider: any = WindowsRadioContext
