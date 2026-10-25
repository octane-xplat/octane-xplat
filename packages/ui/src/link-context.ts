import { createContext } from 'octane'
import type { LinkComponentType } from './props'

/** Context value published by `LinkProvider`. */
export interface LinkContextValue {
	/** Default link component for link-capable components in the subtree. */
	component: LinkComponentType
}

/** Context for the subtree's default link component (Astryx `LinkContext`).
 *  `null` → components render their platform default (`'a'` anchors on web,
 *  the native pressable elsewhere). */
export const LinkContext = createContext<LinkContextValue | null>(null)
