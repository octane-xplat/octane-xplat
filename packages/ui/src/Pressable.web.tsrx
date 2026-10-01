import { useEffect, useRef } from 'octane';
import type { PressableProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { layoutChildProps } from './layout-child.web';
import { usePan } from './pan.web.tsrx';

export function Pressable(props: PressableProps) @{
	const el = useRef<HTMLElement | null>(null);
	const spacePressed = useRef(false);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const latest = useRef(props);
	latest.current = props;

	usePan(el, props.disabled ? undefined : props.onPan);

	const cancel = () => { if (timer.current !== null) { clearTimeout(timer.current); timer.current = null; } };
	useEffect(() => { if (props.disabled) spacePressed.current = false; }, [props.disabled]);
	const enabled = !props.disabled && Boolean(props.onLongPress);
	useEffect(() => { if (!enabled) cancel(); }, [enabled]);
	useEffect(() => () => cancel(), []);

	// Long-press parity with native: ~500ms hold over pointerdown/up.
	const down = () => {
		if (latest.current.disabled || !latest.current.onLongPress) return;
		cancel();
		timer.current = setTimeout(() => {
			timer.current = null;
			if (!latest.current.disabled) latest.current.onLongPress?.();
		}, 500);
	};

	<div
		ref={(e: any) => { el.current = e; if (e) { applyEscapeProps(e, props); props.bind?.(e); } }}
		id={props.id}
		className={['vx-pressable', props.className]}
		{...layoutChildProps(props, { ...props.style, ...(props.hitSlop ? { margin: -props.hitSlop, padding: props.hitSlop } : {}) })}
		role={props.accessibilityRole ?? 'button'}
		aria-label={props.accessibilityLabel}
		aria-description={props.accessibilityHint}
		aria-valuetext={props.accessibilityValue}
		aria-disabled={props.disabled || props.accessibilityState?.disabled || undefined}
		aria-selected={props.accessibilityState?.selected}
		aria-checked={props.accessibilityState?.checked}
		aria-pressed={props.accessibilityState?.pressed}
		aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
		aria-hidden={props.accessible === false ? true : undefined}
		tabIndex={props.onPress && !props.disabled && props.accessible !== false ? 0 : -1}
		onKeyDown={(e: KeyboardEvent) => {
			if (e.target !== e.currentTarget || props.disabled || e.isComposing || !props.onPress) return;
			if (e.key === 'Enter') {
				e.preventDefault();
				if (!e.repeat) props.onPress();
			} else if (e.key === ' ') {
				e.preventDefault();
				spacePressed.current = true;
			}
		}}
		onKeyUp={(e: KeyboardEvent) => {
			if (e.target !== e.currentTarget || e.key !== ' ') return;
			const activate = spacePressed.current;
			spacePressed.current = false;
			if (activate && !props.disabled && props.onPress) {
				e.preventDefault();
				props.onPress();
			}
		}}
		onBlur={() => { spacePressed.current = false; }}
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
