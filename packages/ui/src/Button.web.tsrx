import type { ButtonProps } from "./props";
import { Pressable } from './Pressable.web.tsrx';
import { ActivityIndicator } from './ActivityIndicator.web.tsrx';

/** Self-drawn button — Pressable row with optional leading/trailing content
 *  and a `loading` state that swaps children for the spinner and blocks
 *  presses. `vx-button` makes the row direction; styling is the app's. */
export function Button(props: ButtonProps) @{
	const disabled = props.disabled || props.loading;

	<Pressable
		{...props}
		disabled={disabled}
		className={['vx-button', props.loading ? 'vx-button--loading' : undefined, props.className]}
		accessibilityRole={props.accessibilityRole ?? 'button'}
	>
		{props.loading
			? <ActivityIndicator />
			: <>{props.leading}{props.children}{props.trailing}</>}
	</Pressable>
}
