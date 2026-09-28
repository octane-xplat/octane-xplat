/** @jsxImportSource @nativescript-community/octane */
import type { ActivityIndicatorProps, PlatformWidgetProps } from '../props';
import { cx } from '../cx';
import { applyNativeProps } from '../platformProps';

/** CircularProgressIndicator — the platform spinner (Android indeterminate
 *  ProgressBar via NativeScript `activityindicator`). The self-drawn shared
 *  `ActivityIndicator` lives in the root export. */
export function CircularProgressIndicator(props: PlatformWidgetProps<ActivityIndicatorProps>) @{
	if (props.busy === false) return null;

	<activityindicator
		id={props.id}
		className={cx(props.className)}
		style={props.style}
		busy={props.busy ?? true}
		ref={(el: any) => applyNativeProps(el, props)}
	/>
}
