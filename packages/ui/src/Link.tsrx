/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import { Utils } from '@nativescript/core';
import type { LinkProps } from './props';
import { Pressable } from './Pressable';
import { useLinkComponent } from './use-link-component.tsrx'

/**
 * URL anchor — external/navigation links. For in-app routes use `NavLink`. Import from `@octane-xplat/ui`.
 * `as` prop or a `LinkProvider` component replaces the default pressable —
 * the injected component receives `href`/`onPress` and owns navigation.
 *
 * @see LinkProps, NavLinkProps.
 */
export function Link(props: LinkProps) @{
	const Injected: any = useLinkComponent(props.as)
	if (typeof Injected === 'function') {
		return (
			<Injected id={props.id} href={props.href} onPress={props.onPress} className={props.className} style={props.style}>
				{props.children}
			</Injected>
		)
	}
	<Pressable id={props.id} accessibilityRole={props.accessibilityRole ?? 'link'} className={props.className} style={props.style} onPress={() => { props.onPress?.(); Utils.openUrl(props.href); }}>
		<masonview style={mergeStyle({flexDirection: "row"}, {display: "flex"})}>{props.children}</masonview>
	</Pressable>
}
