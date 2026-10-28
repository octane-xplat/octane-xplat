import { createContext } from 'octane'
import type { OptionListContextValue } from './option-list-contexts'
import type { AppKitSegment } from './segmented-control-keys.macos'

/** Private AppKit registration supports options and child items identically. */
export interface AppKitSegmentedContext extends OptionListContextValue {
	segments: Map<NSView, () => AppKitSegment>
}
export const AppKitSegmentedContext = createContext<AppKitSegmentedContext | null>(null)
export const AppKitSegmentedProvider: any = AppKitSegmentedContext
