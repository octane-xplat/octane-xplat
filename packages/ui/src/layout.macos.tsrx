/** @jsxImportSource @xplat/macos/renderer */
import type { AbsoluteProps, GridProps, SpacerProps, StackProps } from './props'

export function Grid(props: GridProps) @{
	<gridlayout id={props.id} rows={props.rows} columns={props.columns} className={props.className} style={props.style}>
		{props.children}
	</gridlayout>
}

export function Stack(props: StackProps) @{
	<stacklayout id={props.id} className={props.className} style={props.style}>
		{props.children}
	</stacklayout>
}

export function Absolute(props: AbsoluteProps) @{
	<absolutelayout id={props.id} className={props.className} style={props.style}>
		{props.children}
	</absolutelayout>
}

export function Spacer(props: SpacerProps) @{
	<flexboxlayout className={props.className} style={{ flexGrow: 1, ...props.style }} />
}
