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
	<Pressable className={props.className} onPress={() => { Utils.openUrl(props.href); }}>
		<flexboxlayout flexDirection="row">{props.children}</flexboxlayout>
	</Pressable>
}
