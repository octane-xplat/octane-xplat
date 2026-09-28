/** @jsxImportSource @nativescript-community/octane */
import type { AbsoluteProps } from './props';
import { cx } from './cx';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';

export function Absolute(props: AbsoluteProps) @{
	<absolutelayout
		id={props.id}
		ref={(view: any) => applyEscapeProps(view, props)}
		className={cx('vx-absolute', props.className)}
		style={props.style}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
		accessibilityLiveRegion={props.accessibilityLiveRegion as any}
	>
		{props.children}
	</absolutelayout>
}
