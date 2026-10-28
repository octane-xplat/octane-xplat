import { useContext, useMemo } from 'octane'
import type { LinkComponentType } from './props'
import { LinkContext } from './link-context'
import { isSafeDestination } from './safe-url'

/** Wraps the resolved component with upstream `useLinkComponent`'s boundary:
 *  `href`/`to` are checked before the handoff — a rejected destination
 *  renders a destination-less anchor without invoking the router component —
 *  and custom components receive `to={href}` so router-style links
 *  (React Router, TanStack) work alongside `href` readers. */
function createSafeLink(Component: any) {
	function SafeLink(props: any) {
		const { href, to, ...rest } = props
		if (!isSafeDestination(href) || !isSafeDestination(to)) {
			return <a {...rest} />
		}

		if (Component === 'a') {
			return <a {...rest} href={href} />
		}

		return <Component {...rest} href={href} to={to ?? href} />
	}

	return SafeLink
}

/** Resolve `as`, then the `LinkProvider` default, then `'a'` (Astryx
 *  `useLinkComponent`). The returned component carries the destination
 *  checks above; memoized so the element identity stays stable while the
 *  resolution is unchanged. */
export function useLinkComponent(as?: LinkComponentType): LinkComponentType {
	const ctx = useContext(LinkContext)
	const resolved: any = as ?? ctx?.component ?? 'a'
	return useMemo(() => createSafeLink(resolved), [resolved])
}
