import type { LinkProps } from './props';
import { useLinkComponent } from './use-link-component.web.tsrx'

/**
 * URL anchor — external/navigation links. For in-app routes use `NavLink`. Import from `@octane-xplat/ui`.
 * The element resolves through `useLinkComponent`: `as` prop, then the
 * `LinkProvider` subtree default, then a plain anchor.
 *
 * @see LinkProps, NavLinkProps.
 */
export function Link(props: LinkProps) @{
	const LinkEl: any = useLinkComponent(props.as)
	<LinkEl
		id={props.id}
		href={props.href}
		target={props.target ?? '_blank'}
		rel="noreferrer"
		role={props.accessibilityRole ?? 'link'}
		onClick={props.onPress}
		className={props.className}
		style={props.style}
	>
		{props.children}
	</LinkEl>
}
