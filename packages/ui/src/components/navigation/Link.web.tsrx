/** @jsxImportSource @octane-xplat/jsx/dom */
import type { LinkProps } from '../../props'
import { useLinkComponent } from './use-link-component.web.tsrx'
import type { JSX } from 'octane/jsx-runtime'

/** URL anchor — external/navigation links (Astryx `Link`). `isExternalLink`
 *  opens a new tab with a ↗ marker; `isStandalone`/`hasUnderline` pick the
 *  presentation; `tooltip` and `color` pass through to the anchor. The
 *  element resolves through `useLinkComponent`: `as` → `LinkProvider`
 *  subtree default → plain anchor. */
export function Link(props: LinkProps): JSX.Element @{
	const LinkEl: any = useLinkComponent(props.as)
	const external = props.isExternalLink === true

	<LinkEl
		id={props.id}
		href={props.href}
		target={props.target ?? (external ? '_blank' : '_self')}
		rel={external || props.target === '_blank' ? 'noreferrer' : undefined}
		role={props.accessibilityRole ?? 'link'}
		onClick={props.onPress}
		title={props.tooltip}
		className={[
			'vx-link',
			props.isStandalone && 'vx-link--standalone',
			props.hasUnderline && 'vx-link--underline',
			external && 'vx-link--external',
			props.className,
		]}
		style={{ ...(props.color ? { color: props.color } : {}), ...((props.style as object) ?? {}) }}
	>
		{props.children}
		{external ? (
			<span className="vx-link-external" aria-hidden="true">
				{'\u2197'}
			</span>
		) : null}
	</LinkEl>
}
