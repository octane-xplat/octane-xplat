/** @jsxImportSource @nativescript-community/octane */
import type { ButtonProps } from "./props";
import { cx } from "./cx";
import { Pressable } from './Pressable.tsrx';
import { ActivityIndicator } from './ActivityIndicator.tsrx';

/** Self-drawn button — Pressable row with optional leading/trailing content
 *  and a `loading` state that swaps children for the spinner and blocks
 *  presses. `vx-button` makes the row direction; styling is the app's. */
export function Button(props: ButtonProps) @{
	const disabled = props.disabled || props.loading;

	<Pressable
		{...props}
		disabled={disabled}
		className={cx('vx-button', props.loading && 'vx-button--loading', props.className)}
		accessibilityRole={props.accessibilityRole ?? 'button'}
	>
		{props.loading
			? <ActivityIndicator />
			: <>{props.leading}{props.children}{props.trailing}</>}
	</Pressable>
}
