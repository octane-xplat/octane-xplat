/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';
import type { ScrollViewProps } from "./props";
import type { RefreshConfig, RefreshController } from './refresh';
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from "./escape-props";
import { layoutChildProps } from './layout-child';
import { ActivityIndicator } from './ActivityIndicator.tsrx';
import { REFRESH_HEADER_HEIGHT } from './refresh-metrics';
import { createPullToRefresh } from './refresh';

/** Pull-enabled variant — grid wrapper hosts the scroller plus the
 *  self-drawn indicator strip; refresh.ts owns the gesture. Only
 *  vertical scrollers pull (horizontal is ignored). */
function ScrollViewRefreshable(props: ScrollViewProps) @{
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
			}}
			id={props.id}
			className="vx-scroll"
			orientation={props.horizontal ? 'horizontal' : 'vertical'}
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
			accessibilityLiveRegion={props.accessibilityLiveRegion as any}
		>
			<flexboxlayout flexDirection={props.horizontal ? 'row' : 'column'}>
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

/** Scroll container — NS <scrollview>. NS ScrollView hosts exactly one
 *  child view, so children are wrapped in a column flexboxlayout — the
 *  same content-container indirection RN's ScrollView does internally.
 *  `horizontal` maps to NS's orientation prop. With `onRefresh`/`refreshing`
 *  the leaf wraps in a pull-to-refresh host (self-drawn indicator). */
export function ScrollView(props: ScrollViewProps) @{
	@if (!props.horizontal && (props.onRefresh != null || props.refreshing != null)) {
		<ScrollViewRefreshable {...props} />
	} @else {
		<scrollview
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			{...layoutChildProps(props)}
			className={cx(props.className)}
			style={props.style}
			orientation={props.horizontal ? 'horizontal' : 'vertical'}
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
			accessibilityLiveRegion={props.accessibilityLiveRegion as any}
		>
			<flexboxlayout flexDirection={props.horizontal ? 'row' : 'column'}>
				{props.children}
			</flexboxlayout>
		</scrollview>
	}
}
