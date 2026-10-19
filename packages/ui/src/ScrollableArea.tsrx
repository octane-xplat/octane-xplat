/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import { useMemo, useEffect, useImperativeHandle, useRef } from 'octane';
import { mergedRef } from './ref-list'
import type { ScrollableAreaHandle, ScrollableAreaProps } from './props';
import type { RefreshConfig, RefreshController } from './refresh';
import { cx } from '@octane-xplat/lib';
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

/** Portable handle over the native scroll view. `blockScroller` is the
 *  viewport's own ScrollView; `inlineScroller` is the nested horizontal
 *  scroller an `axis: 'both'` area mounts — absent otherwise, in which case
 *  the inline offset targets the viewport itself. */
function scrollableAreaHandle(
	blockScroller: { current: any },
	inlineScroller?: { current: any },
): ScrollableAreaHandle {
	return {
		scrollToOffset: (offset, options) => {
			const animated = options?.animated === true;
			if (offset.block != null && Number.isFinite(offset.block)) {
				blockScroller.current?.scrollToVerticalOffset?.(Math.max(0, offset.block), animated);
			}

			if (offset.inline != null && Number.isFinite(offset.inline)) {
				const target = inlineScroller?.current ?? blockScroller.current;
				target?.scrollToHorizontalOffset?.(Math.max(0, offset.inline), animated);
			}
		},
		get native() {
			return blockScroller.current;
		},
	};
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

	const handle = useMemo(() => scrollableAreaHandle(scroller), []);
	useImperativeHandle(props.ref, () => handle, [props.ref]);

	const forwardedRef = useMemo(() => mergedRef((v: any) => {
				scroller.current = v;
				applyEscapeProps(v, props);
			}), [props.ios, props.android, props.web]);

	<masonview ref={(v: any) => {
			if (v?.ios) v.ios.clipsToBounds = true;
		}} {...layoutChildProps(props, mergeStyle({display: "grid"}, props.style as any))} className={cx('vx-refresh-wrap', props.className)}>
		<scrollview
			ref={forwardedRef}
			id={props.id}
			testID={props.testID ?? ''}
			className="vx-scrollable"
			orientation="vertical"
			{...a11y(props)}
		>
			<masonview style={mergeStyle({flexDirection: "column"}, mergeStyle({display: "flex"}, contentPadding(props)))}>
				{props.children}
			</masonview>
		</scrollview>
		<masonview ref={(v: any) => {
				indicator.current = v;
			}} className="vx-refresh" height={REFRESH_HEADER_HEIGHT} translateY={-REFRESH_HEADER_HEIGHT} style={mergeStyle({display: "flex"}, {alignSelf: 'start'})}>
			<ActivityIndicator />
		</masonview>
	</masonview>
}

/** Scroll viewport (Astryx `ScrollableArea`). NativeScript's ScrollView
 *  hosts exactly one child, so children wrap in a content masonview —
 *  the padding + content box lives there. `axis: 'both'` nests a
 *  horizontal scroller inside the vertical one (NS has no two-axis
 *  ScrollView). `overscroll`/`stickyContainment`/`isFullBleed` are web
 *  semantics and inert here; `role` has no native equivalent. */
export function ScrollableArea(props: ScrollableAreaProps) @{
	const axis = props.axis ?? 'block';

	@if (axis === 'block' && (props.onRefresh != null || props.refreshing != null)) {
		<ScrollableAreaRefreshable {...props} />
	} @else {
		<ScrollableAreaCore {...props} />
	}
}

function ScrollableAreaCore(props: ScrollableAreaProps) @{
	const axis = props.axis ?? 'block';
	const horizontal = axis === 'inline';
	const both = axis === 'both';

	const scroller = useRef<any>(null);
	const inlineScroller = useRef<any>(null);
	const handle = useMemo(() => scrollableAreaHandle(scroller, inlineScroller), []);
	useImperativeHandle(props.ref, () => handle, [props.ref]);

	const forwardedRef = useMemo(() => mergedRef((v: any) => {
				scroller.current = v;
				applyEscapeProps(v, props);
			}), [props.ios, props.android, props.web]);

	<scrollview ref={forwardedRef} id={props.id} testID={props.testID ?? ''} {...layoutChildProps(props, mergeStyle({width: props.width as any,
			height: props.height as any,
			maxWidth: props.maxWidth as any,
			minHeight: props.minHeight as any}, props.style as any))} className={cx('vx-scrollable', props.className)} orientation={both ? 'vertical' : horizontal ? 'horizontal' : 'vertical'} {...a11y(props)}>
		{both ? (
			<scrollview
				ref={(v: any) => {
					inlineScroller.current = v;
				}}
				orientation="horizontal"
			>
				<masonview style={mergeStyle({flexDirection: "row"}, mergeStyle({display: "flex"}, contentPadding(props)))}>
					{props.children}
				</masonview>
			</scrollview>
		) : (
			<masonview style={mergeStyle({flexDirection: horizontal ? 'row' : 'column'}, mergeStyle({display: "flex"}, contentPadding(props)))}>
				{props.children}
			</masonview>
		)}
	</scrollview>
}
