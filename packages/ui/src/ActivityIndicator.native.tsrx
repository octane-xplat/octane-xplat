/** @jsxImportSource @nativescript-community/octane */
import type { ActivityIndicatorProps } from './props';
import { cx } from './cx';
import { applyNativeProps } from './platformProps.native';

/** Self-drawn spinner — a bordered ring (.vx-spinner, same class as web)
 *  rotated by an infinite `animate` loop. Identical pixels across targets;
 *  the platform widget (UIActivityIndicatorView/CircularProgressIndicator)
 *  lives in `ui/ios` + `ui/android`. */
export function ActivityIndicator(props: ActivityIndicatorProps) @{
	if (props.busy === false) return null;

	<flexboxlayout
		id={props.id}
		className={cx('vx-spinner', props.className)}
		style={props.style}
		ref={(el: any) => {
			if (!el) return;
			applyNativeProps(el, props);
			el.once('loaded', () => {
				el.animate({
					rotate: 360,
					duration: 800,
					iterations: Number.POSITIVE_INFINITY,
				});
			});
		}}
	/>
}
