/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import type { RowProps } from './props'
import { cx } from '@octane-xplat/lib'
import { layoutChildProps } from './layout-child'

export function Row(props: RowProps) @{
	<masonview id={props.id} {...layoutChildProps(props)} flexDirection="row" alignItems={props.alignItems} justifyContent={props.justifyContent} flexWrap={props.flexWrap} gap={props.gap} className={cx(props.className)} style={mergeStyle({display: "flex"}, props.style)} accessible={props.accessible} accessibilityLabel={props.accessibilityLabel} accessibilityRole={props.accessibilityRole} accessibilityHint={props.accessibilityHint} accessibilityValue={props.accessibilityValue} accessibilityState={props.accessibilityState}>
		{props.children}
	</masonview>
}
