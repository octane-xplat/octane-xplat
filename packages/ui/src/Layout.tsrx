/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle, styleRecord } from './style-merge'
import { useMemo, useContext } from 'octane'
import { refList } from './ref-list'
import type { LayoutProps, LayoutHeaderProps, LayoutContentProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props'
import { spacingPx } from './stack-layout'
import {
	LayoutSlotsContext,
	LayoutSlotsProvider,
	LayoutDividerContext,
	LayoutDividerProvider,
	LayoutPaddingContext,
	LayoutPaddingProvider,
} from './layout-context'

/** Astryx Layout — five-slot region primitive (header / start / content /
 *  end / footer). The container-padding seam is a CSS-var mechanism on
 *  web; the native leaf carries the same contract through
 *  LayoutPaddingContext — Layout's `padding` overrides the outer channel.
 *  Two web-only behaviors have no native analog: `contentWidth`'s internal
 *  alignment (the middle lane is centered/constrained instead) and the
 *  no-divider block padding collapse (a `:has()` rule). */
export function Layout(props: LayoutProps) @{
	const parentPads = useContext(LayoutPaddingContext)
	const parentDivider = useContext(LayoutDividerContext)
	const isFill = (props.height ?? 'fill') === 'fill'
	const pads =
		props.padding != null
			? { ...parentPads, outerX: spacingPx(props.padding) ?? 0, outerY: spacingPx(props.padding) ?? 0 }
			: parentPads
	const slots = {
		hasHeader: props.header != null,
		hasFooter: props.footer != null,
		hasStart: props.start != null,
		hasEnd: props.end != null,
	}
	const dividerValue =
		props.defaultHasDividers != null ? { defaultHasDividers: props.defaultHasDividers } : parentDivider
	const resolvedContent = props.content ?? props.children

	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props) } }, props.ref), [props.ref, props.ios, props.android, props.web])

	<LayoutSlotsProvider value={slots}>
		<LayoutPaddingProvider value={pads}>
			<LayoutDividerProvider value={dividerValue}>
				<masonview
					id={props.id}
					ref={forwardedRef}
					className={cx('vx-layout', props.className)}
					style={mergeStyle({ display: 'flex', flexDirection: 'column', ...(isFill ? { flexGrow: 1 } : {}) }, styleRecord(props.style))}
					accessible={props.accessible}
					accessibilityLabel={props.accessibilityLabel}
					accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
					accessibilityHint={props.accessibilityHint}
					accessibilityValue={props.accessibilityValue}
					accessibilityState={nativeAccessibilityState(props.accessibilityState)}
					accessibilityLiveRegion={props.accessibilityLiveRegion}
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
						<masonview className="vx-layout-contentlane" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
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

/** Astryx LayoutHeader — `Layout`'s header region. Outer shell owns the
 *  divider and sizing; the inner box owns padding (outer channel on the
 *  boundary-touching edges, inner below, `padding`/`paddingBlockEnd`
 *  overrides last). The `--divided` class paints the hairline through the
 *  shared chrome rule. */
export function LayoutHeader(props: LayoutHeaderProps) @{
	const pads = useContext(LayoutPaddingContext)
	const dividerCtx = useContext(LayoutDividerContext)
	const hasDivider = props.hasDivider ?? dividerCtx?.defaultHasDividers ?? false
	const pad = props.padding != null ? spacingPx(props.padding) : undefined
	const padBE = props.paddingBlockEnd != null ? spacingPx(props.paddingBlockEnd) : undefined

	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props) } }, props.ref), [props.ref, props.ios, props.android, props.web])

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
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel ?? props.label}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState)}
		accessibilityLiveRegion={props.accessibilityLiveRegion}
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

/** Astryx LayoutContent — `Layout`'s scrollable content region. Edge-aware
 *  padding resolves from LayoutPaddingContext: outer on edges that touch
 *  the layout boundary (no sibling region), inner otherwise; `padding`
 *  overrides all four. `isScrollable` hosts children in a scrollview —
 *  masonview can't scroll its own overflow. */
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

	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props) } }, props.ref), [props.ref, props.ios, props.android, props.web])

	@if (props.isScrollable !== false) {
		<scrollview
			id={props.id}
			ref={forwardedRef}
			className={cx('vx-layout-content', 'vx-layout-content--scroll', props.className)}
			style={mergeStyle(sizeStyle, styleRecord(props.style))}
			orientation="vertical"
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel ?? props.label}
			accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={nativeAccessibilityState(props.accessibilityState)}
			accessibilityLiveRegion={props.accessibilityLiveRegion}
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
			style={mergeStyle({ display: 'flex', flexDirection: 'column', ...sizeStyle, ...padStyle }, styleRecord(props.style))}
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel ?? props.label}
			accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={nativeAccessibilityState(props.accessibilityState)}
			accessibilityLiveRegion={props.accessibilityLiveRegion}
		>
			{props.children}
		</masonview>
	}
}
