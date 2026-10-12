import { useEffect, useMemo, useRef } from 'octane';
import { refList } from './ref-list';
import type { FocusScopeProps } from './props';
import { applyEscapeProps } from './escape-props';
import { applyWebProps } from './platformProps.web';

/** FocusScope — keyboard focus containment, React Aria's FocusScope. The
 *  web leaf renders a div that can trap Tab inside its subtree (`contain`),
 *  focus the first tab stop on mount (`autoFocus`), and restore focus to
 *  the previously focused element on unmount (`restoreFocus`). Nested
 *  scopes are not stacked — `contain` owns the whole document while it is
 *  mounted, matching modal-focus's single-owner model. */

const TAB_STOP_SELECTOR =
	'a[href],button,input,textarea,select,[tabindex],[contenteditable="true"]';

function tabStops(root: HTMLElement): HTMLElement[] {
	return Array.from(root.querySelectorAll<HTMLElement>(TAB_STOP_SELECTOR)).filter(
		(el) => el.tabIndex >= 0 && !el.matches(':disabled') && !el.closest('[inert],[hidden]'),
	);
}

export function FocusScope(props: FocusScopeProps) @{
	const scopeEl = useRef<HTMLElement | null>(null);
	const previouslyFocused = useRef<HTMLElement | null>(null);
	const lastFocused = useRef<HTMLElement | null>(null);

	useEffect(() => {
		const el = scopeEl.current;
		if (!el) {
			return;
		}

		const doc = el.ownerDocument;
		previouslyFocused.current = doc.activeElement as HTMLElement | null;
		if (props.autoFocus) {
			(tabStops(el)[0] ?? el).focus({ preventScroll: true });
		}

		const restore = () => {
			if (props.restoreFocus && previouslyFocused.current?.isConnected) {
				previouslyFocused.current.focus({ preventScroll: true });
			}
		};

		if (!props.contain) {
			return restore;
		}

		const refocus = () => {
			const last = lastFocused.current;
			const target = last && el.contains(last) ? last : tabStops(el)[0] ?? el;
			target.focus({ preventScroll: true });
		};

		const trackFocus = (event: FocusEvent) => {
			if (event.target instanceof HTMLElement && el.contains(event.target)) {
				lastFocused.current = event.target;
			}
		};

		const onFocusIn = (event: FocusEvent) => {
			if (el.isConnected && !el.contains(event.target as Node)) {
				refocus();
			}
		};

		el.addEventListener('focusin', trackFocus);
		doc.addEventListener('focusin', onFocusIn, true);
		return () => {
			el.removeEventListener('focusin', trackFocus);
			doc.removeEventListener('focusin', onFocusIn, true);
			restore();
		};
	}, []);

	const onKeyDown = (event: KeyboardEvent) => {
		const el = scopeEl.current;
		if (!props.contain || event.key !== 'Tab' || !el) {
			return;
		}

		const stops = tabStops(el);
		const active = el.ownerDocument.activeElement;
		if (!stops.length) {
			event.preventDefault();
			el.focus({ preventScroll: true });
		} else if (event.shiftKey ? active === stops[0] : active === stops[stops.length - 1]) {
			event.preventDefault();
			(event.shiftKey ? stops[stops.length - 1] : stops[0]).focus({ preventScroll: true });
		}
	};

	const forwardedRef = useMemo(() => refList((e: any) => {
		scopeEl.current = e;
		if (e) {
			applyEscapeProps(e, props);
			applyWebProps(e, props.web);
		}
	}, props.ref), [props.ref, props.ios, props.android, props.web]);

	<div
		id={props.id}
		ref={forwardedRef}
		className={props.className}
		style={props.style}
		role={props.accessibilityRole}
		aria-label={props.accessibilityLabel}
		aria-hidden={props.accessible === false ? true : undefined}
		aria-description={props.accessibilityHint}
		aria-valuetext={props.accessibilityValue}
		aria-disabled={props.accessibilityState?.disabled}
		aria-selected={props.accessibilityState?.selected}
		aria-checked={props.accessibilityState?.checked}
		aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
		tabIndex={-1}
		onKeyDown={onKeyDown}
	>
		{props.children}
	</div>
}
