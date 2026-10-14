export * from './index.shared'
export { KeyboardAvoiding } from './KeyboardAvoiding.mobile.tsrx'
// Native-view outline discovery — the DOM form lives under `@octane-xplat/ui/web`.
export { useOutlineFromView } from './outline-view.tsrx'

// Keep native status-bar icon appearance synced with the effective theme scheme.
import './theme/status-bar-scheme.mobile'
