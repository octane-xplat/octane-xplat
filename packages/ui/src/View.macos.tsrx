/** @jsxImportSource @octane-xplat/macos-renderer */
import type { ViewProps } from './props'
import { cx } from './cx'
import { layoutChildProps } from './layout-child'
import { usePan } from './pan.macos.tsrx'

export function View(props: ViewProps) @{
	<flexboxlayout
		id={props.id}
		ref={props.ref}
		{...layoutChildProps(props)}
		flexDirection="column"
		alignItems={props.alignItems}
		justifyContent={props.justifyContent}
		flexWrap={props.flexWrap}
		gap={props.gap}
		className={cx(props.className)}
		style={props.style}
		onPan={usePan(props.onPan)}
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

export const Column = View
