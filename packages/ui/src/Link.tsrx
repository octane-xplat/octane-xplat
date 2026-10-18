/** @jsxImportSource @nativescript-community/octane */
import { Utils } from '@nativescript/core';
import type { LinkProps } from './props';
import { Pressable } from './Pressable';

/**
 * URL anchor — external/navigation links. For in-app routes use `NavLink`. Import from `@octane-xplat/ui`.
 *
 * @see LinkProps, NavLinkProps.
 */
export function Link(props: LinkProps) @{
	<Pressable id={props.id} accessibilityRole={props.accessibilityRole ?? 'link'} className={props.className} style={props.style} onPress={() => { props.onPress?.(); Utils.openUrl(props.href); }}>
		<masonview display="flex" flexDirection="row">{props.children}</masonview>
	</Pressable>
}
