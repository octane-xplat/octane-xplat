import type { SafeAreaProps } from './props';
import { useSafeAreaInsets } from './safeAreaInsets.web.tsrx';

function applyWebProps(node: any, bag?: Record<string, any>) {
	if (!node || !bag) return;
	for (const [key, value] of Object.entries(bag)) {
		if (key.includes('-')) node.setAttribute(key, String(value));
		else node[key] = value;
	}
}

export function SafeArea(props: SafeAreaProps) @{
	const insets = useSafeAreaInsets();
	<div
		ref={(node: any) => applyWebProps(node, props.web)}
		className={['vx-safe-area', props.className]}
		style={{ ...props.style, paddingTop: insets.top, paddingRight: insets.right, paddingBottom: insets.bottom, paddingLeft: insets.left }}
	>
		{props.children}
	</div>
}
