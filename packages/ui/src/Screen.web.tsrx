import type { ScreenProps } from "./props";
export function Screen(props: ScreenProps) @{
	<div className={['vx-screen', props.className]} style={props.style}>
		{props.children}
	</div>
}
