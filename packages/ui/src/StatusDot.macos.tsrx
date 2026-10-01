/** @jsxImportSource @xplat/macos/renderer */
import { useEffect, useRef } from 'octane';
import type { StatusDotProps } from './props';
import { cx } from './cx';
import { getColorScheme } from './colorScheme.macos';
import { statusDotColor } from './scheme-colors';
import { isRenderable } from './is-renderable';

/** StatusDot — macOS leaf. The AppKit host has no `animate` — `isPulsing` is
 *  a steady dot here (documented). Variant colors come from the scheme
 *  palette mirror since the host has no CSS layer. */
export function StatusDot(props: StatusDotProps) @{
	const dot = useRef<any>(null);
	const scheme = getColorScheme();
	// The AppKit layer animates via CAAnimation — a JS opacity loop is the
	// same pulse without adding host plumbing.
	useEffect(() => {
		const view = dot.current;
		if (!props.isPulsing || !view) {
			return;
		}

		let cancelled = false;
		const beat = (opacity: number) => {
			if (cancelled || !dot.current) {
				return;
			}

			const result = view.animate?.({ opacity, duration: 750 });
			if (result?.then) {
				result.then(
					() => !cancelled && beat(opacity === 1 ? 0.4 : 1),
					() => !cancelled && beat(opacity === 1 ? 0.4 : 1),
				);
			}
		};

		beat(0.4);
		return () => {
			cancelled = true;
		};
	}, [props.isPulsing]);

	<flexboxlayout
		ref={(v: any) => {
			dot.current = v;
		}}
		id={props.id}
		className={cx('vx-statusdot', `vx-statusdot--${props.variant}`, props.className)}
		style={{
			width: 8,
			height: 8,
			borderRadius: 4,
			backgroundColor: statusDotColor(props.variant, scheme),
			justifyContent: 'center',
			alignItems: 'center',
			...props.style,
		}}
		accessible={true}
		accessibilityRole="image"
		accessibilityLabel={props.label}
	>
		{isRenderable(props.icon) ? props.icon : null}
	</flexboxlayout>
}
