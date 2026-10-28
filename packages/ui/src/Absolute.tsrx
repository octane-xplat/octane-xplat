/** @jsxImportSource @octane-xplat/jsx */
import type { AbsoluteProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props'

/**
 * Positioned/overlap container — the stack-in-absolute-space layer. Import from `@octane-xplat/ui`.
 *
 * @see AbsoluteProps.
 */
export function Absolute(props: AbsoluteProps) @{
	<masonview
		id={props.id}
		ref={(view: any) => applyEscapeProps(view, props)}
		className={cx('vx-absolute', props.className)}
		style={props.style}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState)}
		accessibilityLiveRegion={props.accessibilityLiveRegion}
	>
		{props.children}
	</masonview>
}
