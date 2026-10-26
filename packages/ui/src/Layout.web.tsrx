import { mergeStyle, styleRecord } from './style-merge'
import { useMemo, useContext } from 'octane'
import { refList } from './ref-list'
import type { LayoutProps, LayoutHeaderProps, LayoutContentProps, SizeValue } from './props'
import { applyEscapeProps } from './escape-props'
import { applyWebProps } from './platformProps.web'
import { spacingPx } from './stack-layout'
import {
	LayoutSlotsContext,
	LayoutSlotsProvider,
	LayoutDividerContext,
	LayoutDividerProvider,
} from './layout-context'

/** Astryx's internal-alignment gate: `contentWidth` keeps LayoutContent's
 *  scrollport full width and aligns children through inline insets only
 *  when the value can share one CSS arithmetic basis — lengths, `calc()`,
 *  `min()`, `max()`, `clamp()`. Percentages (including percentage-bearing
 *  math), intrinsic keywords, and bare `var()` take the constrained
 *  composition instead. */
function supportsInternalContentWidthAlignment(width: SizeValue | undefined): boolean {
	if (width == null || typeof width === 'number') {
		return true
	}
	const value = width.trim().toLowerCase()
	if (value.includes('%')) {
		return false
	}
	return (
		value === '0' ||
		/^-?(?:\d+(?:\.\d+)?|\.\d+)[a-z]+$/.test(value) ||
		/^(?:calc|min|max|clamp)\(/.test(value)
	)
}

/** Astryx Layout — five-slot region primitive (header / start / content /
 *  end / footer). The container-padding seam (`--container-padding-*`,
 *  `--layout-padding-*`, `--layout-content-width`,
 *  `--layout-alignment-width`) is published and consumed as CSS custom
 *  properties; tokens.css carries the geometry. The outer box escapes an
 *  ancestor's published container padding (bleed) and the inner box resets
 *  it for descendants — the same escape/reset split `Section` uses. */
export function Layout(props: LayoutProps) @{
	const isFill = (props.height ?? 'fill') === 'fill'
	const resolvedContent = props.content ?? props.children
	const hasHeader = props.header != null
	const hasFooter = props.footer != null
	const hasStart = props.start != null
	const hasEnd = props.end != null
	const hasBothPanels = hasStart && hasEnd
	const hasSinglePanel = hasStart !== hasEnd
	const usesInternalContentWidth =
		props.contentWidth != null && supportsInternalContentWidthAlignment(props.contentWidth)
	const slots = { hasHeader, hasFooter, hasStart, hasEnd }

	const innerStyle: Record<string, any> = {}
	if (props.padding != null) {
		const px = `${spacingPx(props.padding)}px`
		innerStyle['--layout-padding-outer-x'] = px
		innerStyle['--layout-padding-outer-y'] = px
	}
	if (props.contentWidth != null) {
		const width = typeof props.contentWidth === 'number' ? `${props.contentWidth}px` : props.contentWidth
		innerStyle['--layout-content-width'] = width
		if (usesInternalContentWidth) {
			innerStyle['--layout-alignment-width'] = width
		}
	}

	const forwardedRef = useMemo(() => refList((e: any) => { if (e) { applyEscapeProps(e, props); applyWebProps(e, props.web) } }, props.ref), [props.ref, props.ios, props.android, props.web])

	const tree = (
		<LayoutSlotsProvider value={slots}>
			<div
				id={props.id}
				ref={forwardedRef}
				className={['vx-layout', isFill ? 'vx-layout--fill' : 'vx-layout--auto', props.className]}
				style={props.style}
				role={props.accessibilityRole}
				aria-label={props.accessibilityLabel}
				aria-hidden={props.accessible === false ? true : undefined}
			>
				<div className={['vx-layout-inner', isFill ? 'vx-layout--fill' : 'vx-layout--auto']} style={innerStyle}>
					{props.header}
					<div
						className={[
							'vx-layout-middle',
							props.contentWidth != null && (!usesInternalContentWidth || hasBothPanels) && 'vx-layout-middle--constrained',
							usesInternalContentWidth && !hasBothPanels && 'vx-layout-middle--query',
							usesInternalContentWidth && hasSinglePanel && 'vx-layout-middle--singlepanel',
							usesInternalContentWidth && hasStart && !hasEnd && 'vx-layout-middle--startpanel',
							usesInternalContentWidth && !hasStart && hasEnd && 'vx-layout-middle--endpanel',
						]}
					>
						{props.start}
						<div
							className={[
								'vx-layout-contentlane',
								usesInternalContentWidth && !hasStart && !hasEnd && 'vx-layout-contentlane--singlecolumn',
							]}
						>
							{resolvedContent}
						</div>
						{props.end}
					</div>
					{props.footer}
				</div>
			</div>
		</LayoutSlotsProvider>
	)

	if (props.defaultHasDividers != null) {
		return (
			<LayoutDividerProvider value={{ defaultHasDividers: props.defaultHasDividers }}>
				{tree}
			</LayoutDividerProvider>
		)
	}
	return tree
}

/** Astryx LayoutHeader — `Layout`'s header region. The outer shell owns the
 *  divider border and sizing; the inner box owns padding (`--vx-lh-pad-*`
 *  resolve the layout's outer/inner channels, overridden by `padding` /
 *  `paddingBlockEnd`) and publishes `--container-padding-*` for bleed
 *  children. `data-divider` drives the content region's no-divider padding
 *  collapse in CSS. */
export function LayoutHeader(props: LayoutHeaderProps) @{
	const dividerCtx = useContext(LayoutDividerContext)
	const resolvedHasDivider = props.hasDivider ?? dividerCtx?.defaultHasDividers ?? false

	const innerStyle: Record<string, any> = {}
	if (props.padding != null) {
		const px = `${spacingPx(props.padding)}px`
		innerStyle['--vx-lh-pad-is'] = px
		innerStyle['--vx-lh-pad-ie'] = px
		innerStyle['--vx-lh-pad-bs'] = px
		innerStyle['--vx-lh-pad-be'] = px
	}
	if (props.paddingBlockEnd != null) {
		innerStyle['--vx-lh-pad-be'] = `${spacingPx(props.paddingBlockEnd)}px`
	}

	const forwardedRef = useMemo(() => refList((e: any) => { if (e) { applyEscapeProps(e, props); applyWebProps(e, props.web) } }, props.ref), [props.ref, props.ios, props.android, props.web])

	<div
		id={props.id}
		ref={forwardedRef}
		className={['vx-layout-header', resolvedHasDivider && 'vx-layout-header--divided', props.className]}
		style={mergeStyle({
			height: props.height,
			width: props.width,
			maxWidth: props.maxWidth,
			minHeight: props.minHeight,
		}, props.style)}
		role={props.role ?? props.accessibilityRole}
		aria-label={props.accessibilityLabel ?? props.label}
		aria-hidden={props.accessible === false ? true : undefined}
		data-divider={resolvedHasDivider || undefined}
	>
		<div className="vx-layout-header-inner" style={innerStyle}>
			{props.children}
		</div>
	</div>
}

/** Astryx LayoutContent — `Layout`'s scrollable content region. Per-edge
 *  resolved padding flows through `--vx-lc-pad-*`: the layout's outer
 *  channel on edges that touch the boundary (no sibling region there),
 *  inner otherwise, explicit `padding`/`0` last via inline vars. The
 *  `--align-*` classes add the `contentWidth` alignment gutter. */
export function LayoutContent(props: LayoutContentProps) @{
	const { hasHeader, hasFooter, hasStart, hasEnd } = useContext(LayoutSlotsContext)
	const explicit = props.padding != null
	const isZero = props.padding === 0

	const style: Record<string, any> = {}
	if (explicit) {
		const px = `${spacingPx(props.padding)}px`
		style['--vx-lc-pad-is'] = px
		style['--vx-lc-pad-ie'] = px
		style['--vx-lc-pad-bs'] = px
		style['--vx-lc-pad-be'] = px
	}
	if (props.height != null) style.height = props.height
	if (props.width != null) style.width = props.width
	if (props.maxWidth != null) style.maxWidth = props.maxWidth
	if (props.minHeight != null) style.minHeight = props.minHeight

	const forwardedRef = useMemo(() => refList((e: any) => { if (e) { applyEscapeProps(e, props); applyWebProps(e, props.web) } }, props.ref), [props.ref, props.ios, props.android, props.web])

	<div
		id={props.id}
		ref={forwardedRef}
		className={[
			'vx-layout-content',
			props.isScrollable !== false && 'vx-layout-content--scroll',
			!hasStart && !explicit && 'vx-layout-content--nostart',
			!hasEnd && !explicit && 'vx-layout-content--noend',
			!hasHeader && !explicit && 'vx-layout-content--noheader',
			!hasFooter && !explicit && 'vx-layout-content--nofooter',
			!hasStart && !hasEnd && !isZero && 'vx-layout-content--align-nopanels',
			hasStart && !hasEnd && !isZero && 'vx-layout-content--align-startpanel',
			!hasStart && hasEnd && !isZero && 'vx-layout-content--align-endpanel',
			props.className,
		]}
		style={mergeStyle(style, styleRecord(props.style))}
		role={props.role ?? props.accessibilityRole}
		aria-label={props.accessibilityLabel ?? props.label}
		aria-hidden={props.accessible === false ? true : undefined}
	>
		{props.children}
	</div>
}
