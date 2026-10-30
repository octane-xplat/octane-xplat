import { createContext, type Context } from 'octane'

/** @internal Space supplied by avoidance ancestors in the same native window. */
export interface ConsumedKeyboardAvoidance {
	window?: object
	bottom: number
}

export const KeyboardAvoidanceContext: Context<ConsumedKeyboardAvoidance> =
	createContext<ConsumedKeyboardAvoidance>({ bottom: 0 })

export const KeyboardAvoidanceProvider: any = KeyboardAvoidanceContext
