/** @jsxImportSource @nativescript-community/octane */
import type { StackProps } from './props';
import { cx } from './cx';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';

export function Stack(props: StackProps) @{
	<gridlayout
		id={props.id}
		ref={(view: any) => applyEscapeProps(view, props)}
		rows="*"
		columns="*"
		className={cx('vx-stack', props.className)}
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
	</gridlayout>
}
