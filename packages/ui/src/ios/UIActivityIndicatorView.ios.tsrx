/** @jsxImportSource @nativescript-community/octane */
import type { UIActivityIndicatorViewProps } from '../props';
import { cx } from '@octane-xplat/lib';
import { applyNativeProps } from '../platformProps';

/** UIActivityIndicatorView — the platform spinner (UIKit). The self-drawn
 *  shared `ActivityIndicator` lives in the root export. */
export function UIActivityIndicatorView(props: UIActivityIndicatorViewProps) @{
	if (props.busy === false) return null;

	<activityindicator
		id={props.id}
		className={cx(props.className)}
		style={props.style as any}
		busy={props.busy ?? true}
		ref={(el: any) => applyNativeProps(el, props)}
	/>
}
