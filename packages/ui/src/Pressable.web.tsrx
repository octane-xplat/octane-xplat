import type { PressableProps } from "./props";

export function Pressable(props: PressableProps) @{
	let timer: ReturnType<typeof setTimeout> | null = null;

	const cancel = () => { if (timer !== null) { clearTimeout(timer); timer = null; } };

	// Long-press parity with native: ~500ms hold over pointerdown/up.
	const down = () => {
		if (props.disabled || !props.onLongPress) return;
		cancel();
		timer = setTimeout(() => { timer = null; props.onLongPress?.(); }, 500);
	};

	<div
		id={props.id}
		className={['vx-pressable', props.className]}
		style={props.style}
		role={props.accessibilityRole ?? 'button'}
		aria-label={props.accessibilityLabel}
		aria-hidden={props.accessible === false ? true : undefined}
		onClick={props.disabled ? undefined : props.onPress}
		onPointerDown={down}
		onPointerUp={cancel}
		onPointerLeave={cancel}
		onPointerCancel={cancel}
	>
		{props.children}
	</div>
}
