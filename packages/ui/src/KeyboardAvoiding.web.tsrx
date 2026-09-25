import type { KeyboardAvoidingProps } from './props';

function applyWebProps(node: any, bag?: Record<string, any>) {
	if (!node || !bag) return;
	for (const [key, value] of Object.entries(bag)) {
		if (key.includes('-')) node.setAttribute(key, String(value));
		else node[key] = value;
	}
}

export function KeyboardAvoiding(props: KeyboardAvoidingProps) @{
	<div
		id={props.id}
		ref={(node: any) => applyWebProps(node, props.web)}
		className={['vx-keyboard-avoiding', props.className]}
		style={props.style}
	>
		{props.children}
	</div>
}
