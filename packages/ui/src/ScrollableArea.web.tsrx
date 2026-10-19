import { useMemo, useEffect, useImperativeHandle, useRef } from 'octane';
import { styleRecord } from './style-merge'
import { refList } from './ref-list'
import type { ScrollableAreaHandle, ScrollableAreaProps } from './props';
import type { RefreshConfig, RefreshController } from './refresh.web';
import { applyEscapeProps } from './escape-props';
import { layoutChildProps } from './layout-child.web';
import { ActivityIndicator } from './ActivityIndicator.web.tsrx';
import { REFRESH_HEADER_HEIGHT } from './refresh-metrics';
import { createPullToRefresh } from './refresh.web';
import { useScrollableArea } from './use-scrollable-area.web.tsrx';
import { spacingStep } from './spacing';

const size = (v: number | string | undefined) =>
	v == null ? undefined : typeof v === 'number' ? `${v}px` : v;

function contentPadding(props: ScrollableAreaProps) {
	const inline = spacingStep(props.paddingInline ?? props.padding);
	const block = spacingStep(props.paddingBlock ?? props.padding);
	const style: Record<string, any> = {};
	if (inline != null) {
		style.paddingInlineStart = `${spacingStep(props.paddingInlineStart) ?? inline}px`;
		style.paddingInlineEnd = `${spacingStep(props.paddingInlineEnd) ?? inline}px`;
	} else {
		if (props.paddingInlineStart != null) {
			style.paddingInlineStart = `${spacingStep(props.paddingInlineStart)}px`;
		}

		if (props.paddingInlineEnd != null) {
			style.paddingInlineEnd = `${spacingStep(props.paddingInlineEnd)}px`;
		}
	}

	if (block != null) {
		style.paddingBlockStart = `${spacingStep(props.paddingBlockStart) ?? block}px`;
		style.paddingBlockEnd = `${spacingStep(props.paddingBlockEnd) ?? block}px`;
	} else {
		if (props.paddingBlockStart != null) {
			style.paddingBlockStart = `${spacingStep(props.paddingBlockStart)}px`;
		}

		if (props.paddingBlockEnd != null) {
			style.paddingBlockEnd = `${spacingStep(props.paddingBlockEnd)}px`;
		}
	}

	return style;
}

/** Portable handle over the viewport element. Inline offsets follow the
 *  writing direction — RTL scrollLeft runs negative in current engines, so
 *  an inline-start offset maps to `-x` there (same convention the hook's
 *  measurement uses). */
function scrollableAreaHandle(viewport: { current: HTMLElement | null }): ScrollableAreaHandle {
	return {
		scrollToOffset: (offset, options) => {
			const el = viewport.current;
			if (!el || typeof el.scrollTo !== 'function') return;
			const target: { left?: number; top?: number; behavior: 'auto' | 'smooth' } = {
				behavior: options?.animated === true ? 'smooth' : 'auto',
			};

			if (offset.block != null && Number.isFinite(offset.block)) {
				const maxY = Math.max(0, el.scrollHeight - el.clientHeight);
				target.top = Math.max(0, Math.min(offset.block, maxY));
			}

			if (offset.inline != null && Number.isFinite(offset.inline)) {
				const maxX = Math.max(0, el.scrollWidth - el.clientWidth);
				const clamped = Math.max(0, Math.min(offset.inline, maxX));
				target.left = getComputedStyle(el).direction === 'rtl' ? -clamped : clamped;
			}

			el.scrollTo(target);
		},
		get native() {
			return viewport.current;
		},
	};
}

/** Pull-enabled variant — same structure the old ScrollView used: a
 *  relative wrapper hosts the scroller plus the self-drawn indicator
 *  strip; refresh.web.ts owns the gesture. Only the block axis pulls. */
function ScrollableAreaRefreshable(props: ScrollableAreaProps) @{
	const area = useScrollableArea<HTMLDivElement>({
		axis: props.axis,
		overscroll: props.overscroll,
		stickyContainment: props.stickyContainment,
		keyboardAccess: { owner: 'viewport', label: props.label ?? '', role: props.role },
	});

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

	const { ref: viewportRef, ...viewport } = area.getViewportProps();
	const { ref: contentRef, ...content } = area.getContentProps();

	const handle = useMemo(() => scrollableAreaHandle(scroller), []);
	useImperativeHandle(props.ref, () => handle, [props.ref]);

	const forwardedRef = useMemo(() => [(el: any) => {
				scroller.current = el;

				applyEscapeProps(el, props);
			}, viewportRef], [props.ios, props.android, props.web, viewportRef]);
	const viewportStyle = typeof viewport.style === 'object' ? viewport.style : undefined;
	const contentStyle = typeof content.style === 'object' ? content.style : undefined;

	<div {...layoutChildProps(props, { ...styleRecord(props.style) })} className={['vx-refresh-wrap', props.className]}>
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
			{...viewport}
			ref={forwardedRef}
			id={props.id}
			data-testid={props.testID}
			className={['vx-scrollable', viewport.className]}
			style={{
				...viewportStyle,
				width: size(props.width),
				height: size(props.height),
				maxWidth: size(props.maxWidth),
				minHeight: size(props.minHeight),
			}}
		>
			<div {...content} ref={contentRef} className={['vx-scrollable-content', content.className]} style={{ ...contentStyle, ...contentPadding(props) }}>
				{props.children}
			</div>
		</div>
	</div>
}

/** Scroll viewport (Astryx `ScrollableArea`): axis-aware scrolling with a
 *  named, keyboard-scrollable viewport and live overflow state — see
 *  `useScrollableArea` for the measurement. `overscroll` maps to
 *  `overscroll-behavior`; `stickyContainment` keeps the scroller as the
 *  sticky boundary; `isFullBleed` is inert here (no container-padding
 *  protocol exists yet — documented deviation). */
export function ScrollableArea(props: ScrollableAreaProps) @{
	const axis = props.axis ?? 'block';

	@if (axis === 'block' && (props.onRefresh != null || props.refreshing != null)) {
		<ScrollableAreaRefreshable {...props} />
	} @else {
		<ScrollableAreaCore {...props} />
	}
}

function ScrollableAreaCore(props: ScrollableAreaProps) @{
	const area = useScrollableArea<HTMLDivElement>({
		axis: props.axis,
		overscroll: props.overscroll,
		stickyContainment: props.stickyContainment,
		keyboardAccess: { owner: 'viewport', label: props.label ?? '', role: props.role },
	});

	const { ref: viewportRef, ...viewport } = area.getViewportProps();
	const { ref: contentRef, ...content } = area.getContentProps();
	const outer = layoutChildProps(props, { ...styleRecord(props.style) });

	const viewportEl = useRef<HTMLElement | null>(null);
	const handle = useMemo(() => scrollableAreaHandle(viewportEl), []);
	useImperativeHandle(props.ref, () => handle, [props.ref]);

	const forwardedRef = useMemo(() => refList((el: any) => {
				viewportEl.current = el;
				applyEscapeProps(el, props);
			}, viewportRef), [props.ios, props.android, props.web, viewportRef]);
	const viewportStyle = typeof viewport.style === 'object' ? viewport.style : undefined;
	const contentStyle = typeof content.style === 'object' ? content.style : undefined;

	<div
		{...viewport}
		ref={forwardedRef}
		id={props.id}
		data-testid={props.testID}
		className={['vx-scrollable', props.className]}
		style={{
			...viewportStyle,
			...outer.style,
			width: size(props.width) ?? outer.style?.width,
			height: size(props.height) ?? outer.style?.height,
			maxWidth: size(props.maxWidth),
			minHeight: size(props.minHeight),
		}}
		aria-hidden={props.accessible === false ? true : undefined}
	>
		<div
			{...content}
			ref={contentRef}
			className={['vx-scrollable-content', content.className]}
			style={{ ...contentStyle, ...contentPadding(props) }}
		>
			{props.children}
		</div>
	</div>
}
