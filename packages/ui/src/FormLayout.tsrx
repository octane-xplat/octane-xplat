/** @jsxImportSource @nativescript-community/octane */
import { useMemo, useEffect, useRef } from 'octane';
import type { FormLayoutProps } from './props';
import { cx } from './cx';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { FormLayoutProvider } from './form-layout-context';

/** FormLayout — 'vertical' is a column with 16dip gaps. 'horizontal' is a
 *  single `*`-column-per-child grid row (NativeScript's grid has no
 *  auto-flow; the effect assigns each child its column once laid out).
 *  'horizontal-labels' keeps the column host — each `Field` reads the
 *  context and renders its own label-beside-control row (per-field label
 *  width; the web grid's shared label column has no native analog). */
export function FormLayout(props: FormLayoutProps) @{
	const direction = props.direction ?? 'vertical';
	const value = { direction, defaultOptionality: props.defaultOptionality };
	const host = useRef<any>(null);

	useEffect(() => {
		if (direction !== 'horizontal' || !host.current) { return; }
		const views: any[] = [];
		host.current.eachChildView((child: any) => { views.push(child); return true; });
		host.current.columns = Array.from({ length: Math.max(1, views.length) }, () => '*').join(',');
		for (let index = 0; index < views.length; index++) {
			views[index].col = index;
		}
	}, [props.children, direction]);

	const forwardedRef = useMemo(() => [(v: any) => { host.current = v; if (v) { applyEscapeProps(v, props);  } }, props.ref], [props.ref, props.ios, props.android, props.web]);
	const forwardedRef2 = useMemo(() => [(v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref], [props.ref, props.ios, props.android, props.web]);

	<FormLayoutProvider value={value}>
		{direction === 'horizontal' ? (
			<gridlayout
				id={props.id}
				ref={forwardedRef}
				className={cx('vx-formlayout', 'vx-formlayout--horizontal', props.className)}
				style={props.style}
				accessible={props.accessible}
				accessibilityLabel={props.accessibilityLabel}
				accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
				accessibilityHint={props.accessibilityHint}
				accessibilityValue={props.accessibilityValue}
				accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
				accessibilityLiveRegion={props.accessibilityLiveRegion as any}
			>
				{props.children}
			</gridlayout>
		) : (
			<flexboxlayout
				id={props.id}
				ref={forwardedRef2}
				flexDirection="column"
				gap={16}
				className={cx('vx-formlayout', `vx-formlayout--${direction}`, props.className)}
				style={props.style}
				accessible={props.accessible}
				accessibilityLabel={props.accessibilityLabel}
				accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
				accessibilityHint={props.accessibilityHint}
				accessibilityValue={props.accessibilityValue}
				accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
				accessibilityLiveRegion={props.accessibilityLiveRegion as any}
			>
				{props.children}
			</flexboxlayout>
		)}
	</FormLayoutProvider>
}
