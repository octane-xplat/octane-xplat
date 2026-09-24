/** @jsxImportSource @nativescript-community/octane */
import type { ActivityIndicatorProps } from './props';
import { cx } from './cx';
import { applyNativeProps } from './platformProps.native';

export function ActivityIndicator(props: ActivityIndicatorProps) @{
	if (props.busy === false) return null;

	<activityindicator
		id={props.id}
		className={cx(props.className)}
		style={props.style}
		busy={props.busy ?? true}
		ref={(el: any) => applyNativeProps(el, props)}
	/>
}
