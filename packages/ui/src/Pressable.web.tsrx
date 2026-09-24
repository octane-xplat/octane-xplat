import type { PressableProps } from "./props";
import { applyEscapeProps } from "./escape-props";

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
		ref={(el: any) => applyEscapeProps(el, props)}
		id={props.id}
		className={['vx-pressable', props.ignoreTouchAnimation ? 'vx-pressable-no-feedback' : '', props.className]}
		style={{ ...props.style, ...(props.hitSlop ? { margin: -props.hitSlop, padding: props.hitSlop } : {}) }}
		role={props.accessibilityRole ?? 'button'}
		aria-label={props.accessibilityLabel}
		aria-description={props.accessibilityHint}
		aria-valuetext={props.accessibilityValue}
		aria-disabled={props.accessibilityState?.disabled ?? props.disabled ?? undefined}
		aria-selected={props.accessibilityState?.selected}
		aria-checked={props.accessibilityState?.checked}
		aria-busy={props.accessibilityState?.busy}
		aria-expanded={props.accessibilityState?.expanded}
		aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
		aria-hidden={props.accessible === false ? true : undefined}
		onClick={props.disabled ? undefined : props.onPress}
		onDoubleClick={props.disabled ? undefined : props.onDoublePress}
		onPointerDown={(e: any) => { if (!props.disabled) { props.onPressIn?.(); down(); } }}
		onPointerUp={() => { if (!props.disabled) props.onPressOut?.(); cancel(); }}
		onPointerLeave={() => { if (!props.disabled) props.onPressOut?.(); cancel(); }}
		onPointerCancel={() => { if (!props.disabled) props.onPressOut?.(); cancel(); }}
	>
		{props.children}
	</div>
}
