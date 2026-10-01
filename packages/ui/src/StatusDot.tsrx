/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';
import type { StatusDotProps } from './props';
import { cx } from './cx';
import { applyEscapeProps, nativeAccessibilityRole } from './escape-props';
import { useColorScheme } from './theme/colorScheme';
import { statusDotColor } from './scheme-colors';
import { nativeColor } from './native-color';
import { isRenderable } from './is-renderable';
import { Tooltip } from './Tooltip';

/** StatusDot — an 8pt colored status signal. `label` is the dot's accessible
 *  name. `isPulsing` loops an opacity animation on the native view (no CSS
 *  keyframes in the NS engine). `tooltip` wraps the shared Tooltip — a no-op
 *  on touch targets by Tooltip's own contract. */
export function StatusDot(props: StatusDotProps) @{
	const scheme = useColorScheme();
	const dot = useRef<any>(null);
	const pulsing = props.isPulsing ?? false;

	useEffect(() => {
		const view = dot.current;
		if (!pulsing || !view) {
			return;
		}

		let cancelled = false;
		const beat = (opacity: number) => {
			if (cancelled || !dot.current) {
				return;
			}

			const done = () => {
				if (!cancelled) {
					beat(opacity === 1 ? 0.4 : 1);
				}
			};

			const result = view.animate?.({ opacity, duration: 750, curve: 'easeInOut' });
			if (result?.then) {
				result.then(done, done);
			} else {
				done();
			}
		};

		beat(0.4);

		return () => {
			cancelled = true;
			view.cancelAnimation?.('opacity');
			view.opacity = 1;
		};
	}, [pulsing]);

	const showsIcon = isRenderable(props.icon);

	const view = (
		<flexboxlayout
			ref={(v: any) => {
				dot.current = v;
				applyEscapeProps(v, props);
			}}
			id={props.id}
			className={cx('vx-statusdot', `vx-statusdot--${props.variant}`, props.className)}
			style={{
				width: 8,
				height: 8,
				borderRadius: 4,
				backgroundColor: nativeColor(statusDotColor(props.variant, scheme)),
				justifyContent: 'center',
				alignItems: 'center',
				...props.style,
			}}
			accessible={true}
			accessibilityRole={nativeAccessibilityRole('image') as any}
			accessibilityLabel={props.label}
		>
			{showsIcon ? props.icon : null}
		</flexboxlayout>
	);

	return props.tooltip != null
		? <Tooltip trigger={view} content={props.tooltip} />
		: view;
}
