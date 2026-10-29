/** @jsxImportSource @octane-xplat/jsx */
import type { CircularProgressIndicatorProps } from '../props'
import { cx } from '@octane-xplat/lib'
import { applyNativeProps } from '../internal/platform/platformProps'

/** CircularProgressIndicator — the platform spinner (Android indeterminate
 *  ProgressBar via NativeScript `activityindicator`). The self-drawn shared
 *  `ActivityIndicator` lives in the root export. */
export function CircularProgressIndicator(props: CircularProgressIndicatorProps) @{
	if (props.busy === false) {
		return null
	}

	<activityindicator
		id={props.id}
		className={cx(props.className)}
		style={props.style}
		busy={props.busy ?? true}
		ref={(el: any) => applyNativeProps(el, props)}
	/>
}
