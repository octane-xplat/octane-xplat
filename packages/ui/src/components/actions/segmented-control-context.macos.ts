import { createContext } from 'octane'
import type { OptionListContextValue } from '../forms/option-list-contexts'
import type { AppKitSegment } from './segmented-control-keys.macos'
import type { NSView } from '@octane-xplat/platform/macos'

/** Private AppKit registration supports options and child items identically. */
export interface AppKitSegmentedContext extends OptionListContextValue {
	segments: Map<NSView, () => AppKitSegment>
}
export const AppKitSegmentedContext = createContext<AppKitSegmentedContext | null>(null)
export const AppKitSegmentedProvider: any = AppKitSegmentedContext
