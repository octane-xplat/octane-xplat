/** @jsxImportSource @nativescript-community/octane */
import { Pressable } from '@xplat/ui';
import { navigate } from './platform/nav';
import type { RouteName } from './screens';

/** Link — native side: a Pressable that pushes via the Frame. */
export function Link(props: {
	to: RouteName;
	params?: Record<string, unknown>;
	className?: any;
	children?: any;
}) @{
	<Pressable className={props.className} onPress={() => navigate(props.to, props.params)}>
		{props.children}
	</Pressable>
}
