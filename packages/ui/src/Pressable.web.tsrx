import { useRef } from 'octane';
import type { PressableProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { glassClassOf, glassStyleOf } from './glass';
import { layoutChildProps } from './layout-child.web';
import { usePan } from './pan.web.tsrx';

export function Pressable(props: PressableProps) @{
	const el = useRef<HTMLElement | null>(null);
	let timer: ReturnType<typeof setTimeout> | null = null;

	usePan(el, props.disabled ? undefined : props.onPan);

	const cancel = () => { if (timer !== null) { clearTimeout(timer); timer = null; } };

	// Long-press parity with native: ~500ms hold over pointerdown/up.
	const down = () => {
		if (props.disabled || !props.onLongPress) return;
		cancel();
		timer = setTimeout(() => { timer = null; props.onLongPress?.(); }, 500);
	};

	<div
		ref={(e: any) => { el.current = e; if (e) { applyEscapeProps(e, props); props.bind?.(e); } }}
		id={props.id}
		className={['vx-pressable', props.ignoreTouchAnimation ? 'vx-pressable-no-feedback' : '', glassClassOf(props.glass), props.className]}
		{...layoutChildProps(props, { ...glassStyleOf(props.glass), ...props.style, ...(props.hitSlop ? { margin: -props.hitSlop, padding: props.hitSlop } : {}) })}
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
