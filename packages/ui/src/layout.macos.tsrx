/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from './style-merge'
import { useMemo, useContext } from 'octane'
import { refList } from './ref-list'
import type {
	AbsoluteProps,
	GridProps,
	LayoutContentProps,
	LayoutFooterProps,
	LayoutHeaderProps,
	LayoutPanelProps,
	LayoutProps,
	SpacerProps,
	StackItemProps,
	StackProps,
} from './props'

import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props'
import { resolveStackLayout, spacingPx, stackItemStyle } from './stack-layout'
import {
	LayoutSlotsContext,
	LayoutSlotsProvider,
	LayoutDividerContext,
	LayoutDividerProvider,
	LayoutPaddingContext,
	LayoutPaddingProvider,
	LayoutAreaContext,
} from './layout-context'

import { gridTrackListToCss } from './grid-tracks'

export function Grid(props: GridProps) @{
	<masonview
		id={props.id}
		className={props.className}
		style={mergeStyle(
			{
				display: 'grid',
				gridTemplateRows: gridTrackListToCss(props.rows, 'rows'),
				gridTemplateColumns: gridTrackListToCss(
					typeof props.columns === 'number'
						? String(props.columns)
						: typeof props.columns === 'object'
							? 'auto'
							: props.columns,
					'columns',
				),
			},
			props.style,
		)}
	>
		{props.children}
	</masonview>
}

/** Astryx flow Stack on the AppKit host — same direction/alignment/gap
 *  resolution as the other targets; `isScrollable` hosts the flow in a
 *  scrollview. Overlapping children belong in `Absolute`. */
export function Stack(props: StackProps) @{
	const layout = resolveStackLayout(props)
	const sizingStyle = {
		...(props.width != null ? { width: props.width } : {}),
		...(props.height != null ? { height: props.height } : {}),
		...(props.maxWidth != null ? { maxWidth: props.maxWidth } : {}),
		...(props.minHeight != null ? { minHeight: props.minHeight } : {}),
		...(layout.paddingTop !== undefined ? { paddingTop: layout.paddingTop } : {}),
		...(layout.paddingBottom !== undefined ? { paddingBottom: layout.paddingBottom } : {}),
		...(layout.paddingInlineStart !== undefined ? { paddingLeft: layout.paddingInlineStart } : {}),
		...(layout.paddingInlineEnd !== undefined ? { paddingRight: layout.paddingInlineEnd } : {}),
	}

	const forwardedRef = useMemo(
		() =>
			refList((v: any) => {
				if (v) {
					applyEscapeProps(v, props)
				}
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	@if (layout.scrollable) {
		<scrollview
			id={props.id}
			ref={forwardedRef}
			className={cx('vx-stack', 'vx-stack--scroll', props.className)}
			style={{ ...sizingStyle, ...styleRecord(props.style) }}
			orientation={layout.flexDirection === 'row' ? 'horizontal' : 'vertical'}
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={props.accessibilityRole}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={props.accessibilityState}
			accessibilityLiveRegion={props.accessibilityLiveRegion}
		>
			<masonview
				style={mergeStyle(
					{
						flexDirection: layout.flexDirection,
						justifyContent: layout.justifyContent,
						alignItems: layout.alignItems,
						flexWrap: layout.flexWrap,
						gap: layout.gap,
					},
					{ display: 'flex' },
				)}
			>
				{props.children}
			</masonview>
		</scrollview>
	} @else {
		<masonview
			id={props.id}
			ref={forwardedRef}
			className={cx('vx-stack', props.className)}
			style={mergeStyle(
				{
					flexDirection: layout.flexDirection,
					justifyContent: layout.justifyContent,
					alignItems: layout.alignItems,
					flexWrap: layout.flexWrap,
					gap: layout.gap,
				},
				mergeStyle({ display: 'flex' }, { ...sizingStyle, ...styleRecord(props.style) }),
			)}
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={props.accessibilityRole}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={props.accessibilityState}
			accessibilityLiveRegion={props.accessibilityLiveRegion}
		>
			{props.children}
		</masonview>
	}
}

export function StackItem(props: StackItemProps) @{
	const itemStyle = stackItemStyle(props)

	const forwardedRef = useMemo(
		() =>
			refList((v: any) => {
				if (v) {
					applyEscapeProps(v, props)
				}
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	@if (props.isScrollable) {
		<scrollview
			id={props.id}
			ref={forwardedRef}
			className={cx('vx-stackitem', props.className)}
			style={{ ...itemStyle, ...styleRecord(props.style) }}
			orientation="vertical"
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={props.accessibilityRole}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={props.accessibilityState}
			accessibilityLiveRegion={props.accessibilityLiveRegion}
		>
			<masonview style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}>
				{props.children}
			</masonview>
		</scrollview>
	} @else {
		<masonview
			id={props.id}
			ref={forwardedRef}
			className={cx('vx-stackitem', props.className)}
			style={mergeStyle({ display: 'flex' }, { ...itemStyle, ...styleRecord(props.style) })}
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={props.accessibilityRole}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={props.accessibilityState}
			accessibilityLiveRegion={props.accessibilityLiveRegion}
		>
			{props.children}
		</masonview>
	}
}

export function Absolute(props: AbsoluteProps) @{
	<masonview id={props.id} className={cx('vx-absolute', props.className)} style={props.style}>
		{props.children}
	</masonview>
}

export function Spacer(props: SpacerProps) @{
	<masonview
		className={cx('vx-spacer flex-1', props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
	/>
}

/** Astryx Layout — five-slot region primitive (header / start / content /
 *  end / footer). Same contract as the native leaf: resolved padding flows
 *  through LayoutPaddingContext; the CSS-var seam, `contentWidth` internal
 *  alignment, and no-divider collapse have no AppKit analog (the middle
 *  lane is centered/constrained instead). */
export function Layout(props: LayoutProps) @{
	const parentPads = useContext(LayoutPaddingContext)
	const parentDivider = useContext(LayoutDividerContext)
	const isFill = (props.height ?? 'fill') === 'fill'
	const pads =
		props.padding != null
			? {
					...parentPads,
					outerX: spacingPx(props.padding) ?? 0,
					outerY: spacingPx(props.padding) ?? 0,
				}
			: parentPads

	const slots = {
		hasHeader: props.header != null,
		hasFooter: props.footer != null,
		hasStart: props.start != null,
		hasEnd: props.end != null,
	}

	const dividerValue =
		props.defaultHasDividers != null
			? { defaultHasDividers: props.defaultHasDividers }
			: parentDivider

	const resolvedContent = props.content ?? props.children

	const forwardedRef = useMemo(
		() =>
			refList((v: any) => {
				if (v) {
					applyEscapeProps(v, props)
				}
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	<LayoutSlotsProvider value={slots}>
		<LayoutPaddingProvider value={pads}>
			<LayoutDividerProvider value={dividerValue}>
				<masonview
					id={props.id}
					ref={forwardedRef}
					className={cx('vx-layout', props.className)}
					style={mergeStyle(
						{ display: 'flex', flexDirection: 'column', ...(isFill ? { flexGrow: 1 } : {}) },
						styleRecord(props.style),
					)}
					accessibilityLabel={props.accessibilityLabel}
					accessibilityRole={props.accessibilityRole}
					accessibilityHint={props.accessibilityHint}
				>
					{props.header}
					<masonview
						className="vx-layout-middle"
						style={{
							display: 'flex',
							flexDirection: 'row',
							flexGrow: 1,
							...(props.contentWidth != null
								? { width: '100%', maxWidth: props.contentWidth, alignSelf: 'center' }
								: {}),
						}}
					>
						{props.start}
						<masonview
							className="vx-layout-contentlane"
							style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}
						>
							{resolvedContent}
						</masonview>
						{props.end}
					</masonview>
					{props.footer}
				</masonview>
			</LayoutDividerProvider>
		</LayoutPaddingProvider>
	</LayoutSlotsProvider>
}

/** Astryx LayoutHeader — `Layout`'s header region on the AppKit host. */
export function LayoutHeader(props: LayoutHeaderProps) @{
	const pads = useContext(LayoutPaddingContext)
	const dividerCtx = useContext(LayoutDividerContext)
	const hasDivider = props.hasDivider ?? dividerCtx?.defaultHasDividers ?? false
	const pad = props.padding != null ? spacingPx(props.padding) : undefined
	const padBE = props.paddingBlockEnd != null ? spacingPx(props.paddingBlockEnd) : undefined

	const forwardedRef = useMemo(
		() =>
			refList((v: any) => {
				if (v) {
					applyEscapeProps(v, props)
				}
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	<masonview
		id={props.id}
		ref={forwardedRef}
		className={cx('vx-layout-header', hasDivider && 'vx-layout-header--divided', props.className)}
		style={mergeStyle(
			{
				display: 'flex',
				flexDirection: 'column',
				flexShrink: 0,
				...(props.height != null ? { height: props.height } : {}),
				...(props.width != null ? { width: props.width } : {}),
				...(props.maxWidth != null ? { maxWidth: props.maxWidth } : {}),
				...(props.minHeight != null ? { minHeight: props.minHeight } : {}),
			},
			styleRecord(props.style),
		)}
		accessibilityLabel={props.accessibilityLabel ?? props.label}
		accessibilityRole={props.accessibilityRole}
		accessibilityHint={props.accessibilityHint}
	>
		<masonview
			className="vx-layout-header-inner"
			style={{
				display: 'flex',
				flexDirection: 'column',
				paddingLeft: pad ?? pads.outerX,
				paddingRight: pad ?? pads.outerX,
				paddingTop: pad ?? pads.outerY,
				paddingBottom: padBE ?? pad ?? pads.innerY,
			}}
		>
			{props.children}
		</masonview>
	</masonview>
}

/** Astryx LayoutContent — `Layout`'s scrollable content region on the
 *  AppKit host; `isScrollable` hosts children in a scrollview. */
export function LayoutContent(props: LayoutContentProps) @{
	const slots = useContext(LayoutSlotsContext)
	const pads = useContext(LayoutPaddingContext)
	const pad = props.padding != null ? spacingPx(props.padding) : undefined
	const padStyle = {
		paddingLeft: pad ?? (!slots.hasStart ? pads.outerX : pads.innerX),
		paddingRight: pad ?? (!slots.hasEnd ? pads.outerX : pads.innerX),
		paddingTop: pad ?? (!slots.hasHeader ? pads.outerY : pads.innerY),
		paddingBottom: pad ?? (!slots.hasFooter ? pads.outerY : pads.innerY),
	}

	const sizeStyle = {
		flexGrow: 1,
		...(props.height != null ? { height: props.height } : {}),
		...(props.width != null ? { width: props.width } : {}),
		...(props.maxWidth != null ? { maxWidth: props.maxWidth } : {}),
		...(props.minHeight != null ? { minHeight: props.minHeight } : {}),
	}

	const forwardedRef = useMemo(
		() =>
			refList((v: any) => {
				if (v) {
					applyEscapeProps(v, props)
				}
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	@if (props.isScrollable !== false) {
		<scrollview
			id={props.id}
			ref={forwardedRef}
			className={cx('vx-layout-content', 'vx-layout-content--scroll', props.className)}
			style={mergeStyle(sizeStyle, styleRecord(props.style))}
			orientation="vertical"
			accessibilityLabel={props.accessibilityLabel ?? props.label}
			accessibilityRole={props.accessibilityRole}
			accessibilityHint={props.accessibilityHint}
		>
			<masonview style={{ display: 'flex', flexDirection: 'column', ...padStyle }}>
				{props.children}
			</masonview>
		</scrollview>
	} @else {
		<masonview
			id={props.id}
			ref={forwardedRef}
			className={cx('vx-layout-content', props.className)}
			style={mergeStyle(
				{ display: 'flex', flexDirection: 'column', ...sizeStyle, ...padStyle },
				styleRecord(props.style),
			)}
			accessibilityLabel={props.accessibilityLabel ?? props.label}
			accessibilityRole={props.accessibilityRole}
			accessibilityHint={props.accessibilityHint}
		>
			{props.children}
		</masonview>
	}
}

/** Astryx LayoutFooter — AppKit leaf: outer shell owns divider+sizing,
 *  inner box owns the resolved padding channels. */
export function LayoutFooter(props: LayoutFooterProps) @{
	const pads = useContext(LayoutPaddingContext)
	const dividerCtx = useContext(LayoutDividerContext)
	const hasDivider = props.hasDivider ?? dividerCtx?.defaultHasDividers ?? false
	const pad = props.padding != null ? spacingPx(props.padding) : undefined

	const forwardedRef = useMemo(
		() =>
			refList((v: any) => {
				if (v) {
					applyEscapeProps(v, props)
				}
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	<masonview
		id={props.id}
		ref={forwardedRef}
		className={cx('vx-layout-footer', hasDivider && 'vx-layout-footer--divided', props.className)}
		style={mergeStyle(
			{
				display: 'flex',
				flexDirection: 'column',
				flexShrink: 0,
				...(props.height != null ? { height: props.height } : {}),
				...(props.width != null ? { width: props.width } : {}),
				...(props.maxWidth != null ? { maxWidth: props.maxWidth } : {}),
				...(props.minHeight != null ? { minHeight: props.minHeight } : {}),
			},
			styleRecord(props.style),
		)}
		accessibilityLabel={props.accessibilityLabel ?? props.label}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
	>
		<masonview
			className="vx-layout-footer-inner"
			style={{
				display: 'flex',
				flexDirection: 'column',
				paddingLeft: pad ?? pads.outerX,
				paddingRight: pad ?? pads.outerX,
				paddingTop: pad ?? pads.innerY,
				paddingBottom: pad ?? pads.outerY,
			}}
		>
			{props.children}
		</masonview>
	</masonview>
}

/** Astryx LayoutPanel — AppKit leaf: fixed-width side column; divider is a
 *  class hook the native stylesheet resolves on the content-facing edge. */
export function LayoutPanel(props: LayoutPanelProps) @{
	const area = props.area ?? useContext(LayoutAreaContext) ?? 'start'
	const size = props.resizable?._size ?? props.width
	const pads = useContext(LayoutPaddingContext)
	const pad = props.padding != null ? spacingPx(props.padding) : undefined

	const forwardedRef = useMemo(
		() =>
			refList((v: any) => {
				if (v) {
					applyEscapeProps(v, props)
				}
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	<masonview
		id={props.id}
		ref={forwardedRef}
		className={cx(
			'vx-layout-panel',
			`vx-layout-panel--${area}`,
			props.hasDivider && 'vx-layout-panel--divided',
			props.className,
		)}
		style={mergeStyle(
			{
				display: 'flex',
				flexDirection: 'column',
				flexShrink: 0,
				width: size,
				paddingLeft: pad ?? pads.outerX,
				paddingRight: pad ?? pads.outerX,
				paddingTop: pad ?? pads.innerY,
				paddingBottom: pad ?? pads.innerY,
				...(props.height != null ? { height: props.height } : {}),
				...(props.maxWidth != null ? { maxWidth: props.maxWidth } : {}),
				...(props.minHeight != null ? { minHeight: props.minHeight } : {}),
			},
			styleRecord(props.style),
		)}
		accessibilityLabel={props.accessibilityLabel ?? props.label}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
	>
		{props.children}
	</masonview>
}
