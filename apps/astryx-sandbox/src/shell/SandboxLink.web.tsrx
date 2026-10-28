/** @jsxImportSource @octane-xplat/jsx/dom */
// Port of upstream src/router.tsx `SandboxLink` — internal hrefs go through
// the canonical router (client-side navigation); external/hash links behave
// like normal anchors. Web leaf: DOM anchor + followHref seam; components
// hand it to link slots (`as`, card wrappers) exactly like upstream.

import { followHref } from './follow-href.web'

export interface SandboxLinkProps {
	href: string
	/** Router-style destination injected by `useLinkComponent` — mirrors
	 *  upstream's `to={href}` handoff. Navigation uses `to ?? href`. */
	to?: unknown
	className?: any
	style?: any
	id?: string
	children?: any
	'aria-label'?: string
	onClick?: (e: any) => void
	[key: string]: any
}

function isExternal(href: string) {
	return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)
}

export function SandboxLink(props: SandboxLinkProps) @{
	const { href, to, onClick, ...rest } = props
	const destination = typeof to === 'string' ? to : href
	return (
		<a
			{...rest}
			href={href}
			onClick={(e: any) => {
				onClick?.(e)
				if (e?.defaultPrevented || isExternal(href)) {
					return
				}

				if (e?.button !== undefined && e.button !== 0) {
					return
				}

				if (e?.metaKey || e?.ctrlKey || e?.shiftKey || e?.altKey) {
					return
				}

				e?.preventDefault?.()
				followHref(destination)
			}}
		/>
	)
}

export default SandboxLink
