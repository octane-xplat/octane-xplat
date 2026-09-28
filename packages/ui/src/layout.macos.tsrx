/** @jsxImportSource @xplat/macos/renderer */
import type { AbsoluteProps, GridProps, SpacerProps, StackProps } from './props'
import { cx } from './cx'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props'

export function Grid(props: GridProps) @{
	<gridlayout id={props.id} rows={props.rows} columns={props.columns} className={props.className} style={props.style}>
		{props.children}
	</gridlayout>
}

export function Stack(props: StackProps) @{
	<gridlayout
		id={props.id}
		rows="*"
		columns="*"
		overlayChildren={true}
		className={cx('vx-stack', props.className)}
		style={props.style}
		ref={(view: any) => applyEscapeProps(view, props)}
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

export function Absolute(props: AbsoluteProps) @{
	<absolutelayout id={props.id} className={props.className} style={props.style}>
		{props.children}
	</absolutelayout>
}

export function Spacer(props: SpacerProps) @{
	<flexboxlayout className={props.className} style={{ flexGrow: 1, ...props.style }} />
}
