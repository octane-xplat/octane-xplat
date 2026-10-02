/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';
import type { ScrollableAreaProps } from './props';
import type { RefreshConfig, RefreshController } from './refresh';
import { cx } from './cx';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { layoutChildProps } from './layout-child';
import { ActivityIndicator } from './ActivityIndicator.tsrx';
import { REFRESH_HEADER_HEIGHT } from './refresh-metrics';
import { createPullToRefresh } from './refresh';
import { spacingStep } from './spacing';

/** Native padding — logical start/end map to left/right (NativeScript has
 *  no logical properties; RTL mirroring is the app's escape-hatch job). */
function contentPadding(props: ScrollableAreaProps) {
	const p = spacingStep(props.padding);
	const style: Record<string, any> = {};
	style.paddingTop = spacingStep(props.paddingBlockStart) ?? spacingStep(props.paddingBlock) ?? p ?? 0;
	style.paddingBottom = spacingStep(props.paddingBlockEnd) ?? spacingStep(props.paddingBlock) ?? p ?? 0;
	style.paddingLeft = spacingStep(props.paddingInlineStart) ?? spacingStep(props.paddingInline) ?? p ?? 0;
	style.paddingRight = spacingStep(props.paddingInlineEnd) ?? spacingStep(props.paddingInline) ?? p ?? 0;
	return style;
}

const a11y = (props: ScrollableAreaProps) => ({
	accessible: props.accessible,
	// `label` is the Astryx contract; `accessibilityLabel` still wins when
	// both are given.
	accessibilityLabel: props.accessibilityLabel ?? props.label,
	accessibilityRole: nativeAccessibilityRole(props.accessibilityRole) as any,
	accessibilityHint: props.accessibilityHint,
	accessibilityValue: props.accessibilityValue,
	accessibilityState: nativeAccessibilityState(props.accessibilityState) as any,
	accessibilityLiveRegion: props.accessibilityLiveRegion as any,
});

/** Pull-enabled variant — the grid wrapper hosts the scroller plus the
 *  self-drawn indicator strip; refresh.ts owns the gesture. Only the
 *  block axis pulls. */
function ScrollableAreaRefreshable(props: ScrollableAreaProps) @{
	const cfg = useRef<RefreshConfig>({});
	cfg.current = {
		onRefresh: props.onRefresh,
		refreshing: props.refreshing,
		threshold: props.refreshThreshold,
	};

	const ctl = useRef<RefreshController | null>(null);
	const scroller = useRef<any>(null);
	const indicator = useRef<any>(null);

	useEffect(() => {
		if (!scroller.current || !indicator.current) return;
		ctl.current = createPullToRefresh({
			scroller: scroller.current,
			indicator: indicator.current,
			isAtTop: () => scroller.current?.verticalOffset <= 0,
			cfg,
		});

		return () => {
			ctl.current?.detach();
			ctl.current = null;
		};
	}, []);

	useEffect(() => {
		ctl.current?.sync();
	}, [props.refreshing]);

	<gridlayout
		ref={(v: any) => {
			if (v?.ios) v.ios.clipsToBounds = true;
		}}
		{...layoutChildProps(props)}
		className={cx('vx-refresh-wrap', props.className)}
		style={props.style}
	>
		<scrollview
			ref={(v: any) => {
				scroller.current = v;
				applyEscapeProps(v, props);
				props.bind?.(v);
			}}
			id={props.id}
			className="vx-scrollable"
			orientation="vertical"
			{...a11y(props)}
		>
			<flexboxlayout flexDirection="column" style={contentPadding(props)}>
				{props.children}
			</flexboxlayout>
		</scrollview>
		<flexboxlayout
			ref={(v: any) => {
				indicator.current = v;
			}}
			className="vx-refresh"
			verticalAlignment="top"
			height={REFRESH_HEADER_HEIGHT}
			translateY={-REFRESH_HEADER_HEIGHT}
		>
			<ActivityIndicator />
		</flexboxlayout>
	</gridlayout>
}

/** Scroll viewport (Astryx `ScrollableArea`). NativeScript's ScrollView
 *  hosts exactly one child, so children wrap in a content flexboxlayout —
 *  the padding + content box lives there. `axis: 'both'` nests a
 *  horizontal scroller inside the vertical one (NS has no two-axis
 *  ScrollView). `overscroll`/`stickyContainment`/`isFullBleed` are web
 *  semantics and inert here; `role` has no native equivalent. */
export function ScrollableArea(props: ScrollableAreaProps) @{
	const axis = props.axis ?? 'block';
	const horizontal = axis === 'inline';
	const both = axis === 'both';

	@if (axis === 'block' && (props.onRefresh != null || props.refreshing != null)) {
		<ScrollableAreaRefreshable {...props} />
	} @else {
		<scrollview
			ref={(v: any) => {
				applyEscapeProps(v, props);
				props.bind?.(v);
			}}
			id={props.id}
			{...layoutChildProps(props)}
			className={cx('vx-scrollable', props.className)}
			style={{
				width: props.width as any,
				height: props.height as any,
				maxWidth: props.maxWidth as any,
				minHeight: props.minHeight as any,
				...props.style,
			}}
			orientation={both ? 'vertical' : horizontal ? 'horizontal' : 'vertical'}
			{...a11y(props)}
		>
			{both ? (
				<scrollview orientation="horizontal">
					<flexboxlayout flexDirection="row" style={contentPadding(props)}>
						{props.children}
					</flexboxlayout>
				</scrollview>
			) : (
				<flexboxlayout
					flexDirection={horizontal ? 'row' : 'column'}
					style={contentPadding(props)}
				>
					{props.children}
				</flexboxlayout>
			)}
		</scrollview>
	}
}
