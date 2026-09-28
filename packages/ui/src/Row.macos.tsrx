/** @jsxImportSource @xplat/macos/renderer */
import type { RowProps } from './props'
import { cx } from './cx'
import { layoutChildProps } from './layout-child.native'

export function Row(props: RowProps) @{
	<flexboxlayout
		id={props.id}
		{...layoutChildProps(props)}
		flexDirection="row"
		alignItems={props.alignItems}
		justifyContent={props.justifyContent}
		flexWrap={props.flexWrap}
		gap={props.gap}
		className={cx(props.className)}
		style={props.style}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={props.accessibilityState}
	>
		{props.children}
	</flexboxlayout>
}
