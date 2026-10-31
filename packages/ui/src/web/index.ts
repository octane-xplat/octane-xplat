// @octane-xplat/ui/web — DOM-specific contracts. This subpath resolves only
// under the `web`/`linux` export conditions. Portable components live on the
// root barrel (`@octane-xplat/ui`); the HoverCard/Tooltip re-exports below
// are deprecated compatibility aliases kept for migration.
export { defineWebTransition } from '../routing/web-route-transition.web'
export type { WebTransitionOptions } from '../props'

import type {
	HoverCardProps as SharedHoverCardProps,
	TooltipProps as SharedTooltipProps,
} from '../props'

/** @deprecated `HoverCard` is a portable component — import it from
 *  `@octane-xplat/ui`. This alias will be removed. */
export { HoverCard } from '../components/overlays/HoverCard.web.tsrx'
/** @deprecated `Tooltip` is a portable component — import it from
 *  `@octane-xplat/ui`. This alias will be removed. */
export { Tooltip } from '../components/overlays/Tooltip.web.tsrx'

// DOM-specific discovery — heading outline from a live DOM subtree with
// MutationObserver tracking. The portable derivations
// (useOutlineFromMarkdown/useOutlineFromDoc) stay on the root barrel; the
// view-tree form `useOutlineFromView` lives on the explicit platform paths
// `@octane-xplat/ui/nativescript` (iOS/Android) and `@octane-xplat/ui/macos`.
export { useOutlineFromDOM, outlineItemsFromDOM } from '../components/collections/outline-dom.web.tsrx'
export type { OutlineFromDOMOptions } from '../components/collections/outline-dom.web.tsrx'

/** Props for the HoverCard overlay.
 *  @deprecated Import `HoverCardProps` from `@octane-xplat/ui`. */
export type HoverCardProps = SharedHoverCardProps
/** Props for the Tooltip overlay.
 *  @deprecated Import `TooltipProps` from `@octane-xplat/ui`. */
export type TooltipProps = SharedTooltipProps
