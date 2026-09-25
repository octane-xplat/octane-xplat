/** @jsxImportSource @nativescript-community/octane */
import { useRef, useState } from 'octane';
import { Popover } from './Popover.native.tsrx';
import { Pressable } from './Pressable.native.tsrx';
import { View } from './View.native.tsrx';
import type { HoverableProps } from './props';

/**
 * Native has no hover state. The driver-supported equivalent is a long press;
 * the hint stays in the existing Popover layer until its outside tap dismisses
 * it. `openDelay`/`closeDelay` are intentionally ignored on native because
 * the platform long-press recognizer already supplies the intent threshold.
 */
export function Hoverable(props: HoverableProps) @{
	const [open, setOpen] = useState(false);
	const anchor = useRef<any>(null);

	<View
		className={props.className}
		style={props.style}
		bind={(view: any) => { anchor.current = view; }}
		ios={props.ios}
		android={props.android}
	>
		<Pressable onLongPress={() => setOpen(true)}>
			{props.children}
		</Pressable>
		<Popover
			open={open}
			anchor={anchor}
			placement={props.placement ?? 'bottom'}
			dismissOnOutsideTap
			onDismiss={() => setOpen(false)}
		>
			<View className={props.cardClassName} style={props.cardStyle}>{props.card}</View>
		</Popover>
	</View>
}
