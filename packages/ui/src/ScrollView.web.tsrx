import { useEffect, useRef } from 'octane';
import type { ScrollViewProps } from "./props";
import type { RefreshConfig, RefreshController } from './refresh.web';
import { applyEscapeProps } from "./escape-props";
import { layoutChildProps } from './layout-child.web';
import { ActivityIndicator } from './ActivityIndicator.web.tsrx';
import { REFRESH_HEADER_HEIGHT } from './refresh-metrics';
import { createPullToRefresh } from './refresh.web';

/** Pull-enabled variant — a relative wrapper hosts the scroller plus the
 *  self-drawn indicator strip; refresh.web.ts owns the gesture. Only
 *  vertical scrollers pull (horizontal is ignored). */
function ScrollViewRefreshable(props: ScrollViewProps) @{
	const cfg = useRef<RefreshConfig>({});
	cfg.current = {
		onRefresh: props.onRefresh,
		refreshing: props.refreshing,
		threshold: props.refreshThreshold,
	};

	const ctl = useRef<RefreshController | null>(null);
	const scroller = useRef<HTMLElement | null>(null);
	const indicator = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (!scroller.current || !indicator.current) return;
		ctl.current = createPullToRefresh({
			scroller: scroller.current,
			indicator: indicator.current,
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

	<div
		{...layoutChildProps(props, { ...props.style })}
		className={['vx-refresh-wrap', props.className]}
	>
		<div
			ref={(el: any) => {
				indicator.current = el;
			}}
			className="vx-refresh"
			style={{ transform: `translateY(${-REFRESH_HEADER_HEIGHT}px)` }}
			aria-hidden="true"
		>
			<ActivityIndicator />
		</div>
		<div
			ref={(el: any) => {
				scroller.current = el;
				applyEscapeProps(el, props);
			}}
			id={props.id}
			className="vx-scroll"
			style={{ overflowY: 'auto' }}
			role={props.accessibilityRole}
			aria-label={props.accessibilityLabel}
			aria-hidden={props.accessible === false ? true : undefined}
			aria-description={props.accessibilityHint}
			aria-valuetext={props.accessibilityValue}
			aria-disabled={props.accessibilityState?.disabled}
			aria-selected={props.accessibilityState?.selected}
			aria-checked={props.accessibilityState?.checked}
			aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
		>
			{props.children}
		</div>
	</div>
}

/** Scroll container — a div with overflow scrolling. Native wraps
 *  children in a column container; web divs already stack vertically.
 *  With `onRefresh`/`refreshing` the leaf wraps in a pull-to-refresh
 *  host (self-drawn indicator). */
export function ScrollView(props: ScrollViewProps) @{
	@if (!props.horizontal && (props.onRefresh != null || props.refreshing != null)) {
		<ScrollViewRefreshable {...props} />
	} @else {
		<div
			ref={(e: any) => applyEscapeProps(e, props)}
			id={props.id}
			className={['vx-scroll', props.className]}
			{...layoutChildProps(props, {
				...(props.horizontal ? { overflowX: 'auto' } : { overflowY: 'auto' }),
				...props.style,
			})}
			role={props.accessibilityRole}
			aria-label={props.accessibilityLabel}
			aria-hidden={props.accessible === false ? true : undefined}
			aria-description={props.accessibilityHint}
			aria-valuetext={props.accessibilityValue}
			aria-disabled={props.accessibilityState?.disabled}
			aria-selected={props.accessibilityState?.selected}
			aria-checked={props.accessibilityState?.checked}
			aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
		>
			{props.children}
		</div>
	}
}
