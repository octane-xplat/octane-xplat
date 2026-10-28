/** @jsxImportSource @octane-xplat/jsx */
import { useContext } from 'octane'
import type { LinkComponentType } from './props'
import { LinkContext } from './link-context'

/** Resolve the link element for this component — `as` prop first, then the
 *  `LinkProvider` default, then the `'a'` sentinel meaning "platform
 *  default" (native callers map it to their own link surface). Unlike the
 *  web leaf there is no DOM anchor to guard here: string destinations route
 *  through the canonical router, which rejects unresolvable paths. */
export function useLinkComponent(as?: LinkComponentType): LinkComponentType {
	const ctx = useContext(LinkContext)
	return as ?? ctx?.component ?? 'a'
}
