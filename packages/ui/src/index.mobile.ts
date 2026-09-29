export * from './index.shared'
export { KeyboardAvoiding } from './KeyboardAvoiding.mobile.tsrx'
export type { KeyboardAvoidingProps } from './props'

// Keep native status-bar icon appearance synced with the effective theme scheme.
import './theme/status-bar-scheme.mobile'
