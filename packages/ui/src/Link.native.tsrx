/** @jsxImportSource @nativescript-community/octane */
import { Utils } from '@nativescript/core';
import type { LinkProps } from './props';
import { Pressable } from './Pressable.native.tsrx';

export function Link(props: LinkProps) @{
	<Pressable className={props.className} onPress={() => { Utils.openUrl(props.href); }}>
		<flexboxlayout flexDirection="row">{props.children}</flexboxlayout>
	</Pressable>
}
