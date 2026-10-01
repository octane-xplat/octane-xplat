import { pushDeepLink } from './route.web'

/** Web fallback for programmatic href activation (non-anchor surfaces such
 *  as menu items rendered as buttons). Anchors navigate natively, so this
 *  path is only for elements that asked to handle activation themselves. */
export function followHref(href: string): void {
	if (!href) {return}
	if (pushDeepLink(href)) {return}
	window.location.href = href
}
