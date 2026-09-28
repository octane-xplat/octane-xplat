/** @jsxImportSource @nativescript-community/octane */
import { Pressable } from '@octane-xplat/ui';
import { navigate } from './platform/nav';
import type { RouteLinkProps } from './routes';

/** Link — native side: a Pressable that pushes via the Frame. */
export function Link(props: RouteLinkProps) @{
	<Pressable className={props.className} onPress={() => navigate(props.to, props.params as any, { into: props.into, presentation: props.presentation } as any)}>
		{props.children}
	</Pressable>
}
