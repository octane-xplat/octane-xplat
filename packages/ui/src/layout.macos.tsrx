/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { AbsoluteProps, GridProps, SpacerProps, StackItemProps, StackProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props'
import { resolveStackLayout, stackItemStyle } from './stack-layout'
import { gridTrackListToSpec } from './grid-tracks'

export function Grid(props: GridProps) @{
	<gridlayout id={props.id} rows={gridTrackListToSpec(props.rows, 'rows')} columns={gridTrackListToSpec(props.columns, 'columns')} className={props.className} style={props.style}>
		{props.children}
	</gridlayout>
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

	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	@if (layout.scrollable) {
		<scrollview
			id={props.id}
			ref={forwardedRef}
			className={cx('vx-stack', 'vx-stack--scroll', props.className)}
			style={{ ...(sizingStyle as any), ...(props.style as any) }}
			orientation={layout.flexDirection === 'row' ? 'horizontal' : 'vertical'}
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={props.accessibilityRole}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={props.accessibilityState}
			accessibilityLiveRegion={props.accessibilityLiveRegion}
		>
			<flexboxlayout
				flexDirection={layout.flexDirection}
				justifyContent={layout.justifyContent}
				alignItems={layout.alignItems}
				flexWrap={layout.flexWrap}
				gap={layout.gap}
			>
				{props.children}
			</flexboxlayout>
		</scrollview>
	} @else {
		<flexboxlayout
			id={props.id}
			ref={forwardedRef}
			flexDirection={layout.flexDirection}
			justifyContent={layout.justifyContent}
			alignItems={layout.alignItems}
			flexWrap={layout.flexWrap}
			gap={layout.gap}
			className={cx('vx-stack', props.className)}
			style={{ ...(sizingStyle as any), ...(props.style as any) }}
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={props.accessibilityRole}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={props.accessibilityState}
			accessibilityLiveRegion={props.accessibilityLiveRegion}
		>
			{props.children}
		</flexboxlayout>
	}
}

export function StackItem(props: StackItemProps) @{
	const itemStyle = stackItemStyle(props)

	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	@if (props.isScrollable) {
		<scrollview
			id={props.id}
			ref={forwardedRef}
			className={cx('vx-stackitem', props.className)}
			style={{ ...(itemStyle as any), ...(props.style as any) }}
			orientation="vertical"
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={props.accessibilityRole}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={props.accessibilityState}
			accessibilityLiveRegion={props.accessibilityLiveRegion}
		>
			<flexboxlayout flexDirection="column">{props.children}</flexboxlayout>
		</scrollview>
	} @else {
		<flexboxlayout
			id={props.id}
			ref={forwardedRef}
			className={cx('vx-stackitem', props.className)}
			style={{ ...(itemStyle as any), ...(props.style as any) }}
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={props.accessibilityRole}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={props.accessibilityState}
			accessibilityLiveRegion={props.accessibilityLiveRegion}
		>
			{props.children}
		</flexboxlayout>
	}
}

export function Absolute(props: AbsoluteProps) @{
	<absolutelayout id={props.id} className={props.className} style={props.style}>
		{props.children}
	</absolutelayout>
}

export function Spacer(props: SpacerProps) @{
	<flexboxlayout className={cx('vx-spacer flex-1', props.className)} style={props.style} />
}
