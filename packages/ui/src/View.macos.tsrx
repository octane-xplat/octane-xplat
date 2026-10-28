/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import type { ViewProps } from './props'
import { cx } from '@octane-xplat/lib'
import { layoutChildProps } from './layout-child'
import { usePan } from './pan.macos.tsrx'

export function View(props: ViewProps) @{
	<masonview
		id={props.id}
		ref={props.ref}
		{...layoutChildProps(
			props,
			mergeStyle(
				{
					flexDirection: 'column',
					alignItems: props.alignItems,
					justifyContent: props.justifyContent,
					flexWrap: props.flexWrap,
					gap: props.gap,
				},
				mergeStyle({ display: 'flex' }, props.style),
			),
		)}
		className={cx(props.className)}
		onPan={usePan(props.onPan)}
		onSwipe={props.onSwipe}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={props.accessibilityState}
	>
		{props.children}
	</masonview>
}

export const Column = View
