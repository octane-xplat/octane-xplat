// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, createRoot } from 'octane';
import { useFocus, useFocusRing } from './use-focus';
import { isFocusVisible } from './use-focus-visible';
import { useFocusWithin } from './use-focus-within';
import { useLandmark } from './use-landmark';
import { FocusScope, getFocusScopeCapabilities } from './FocusScope';

// Web lane for the React Aria focus family — the octane DOM renderer maps
// onFocus/onBlur props to focusin/focusout, so hook props spread onto host
// elements see real subtree events.

const keydown = (key: string, init: KeyboardEventInit = {}) =>
	window.dispatchEvent(new KeyboardEvent('keydown', { key, ...init }));

describe('useFocus (DOM renderer)', () => {
	it('fires onFocus/onBlur/onFocusChange and honors isDisabled', () => {
		const onFocus = vi.fn();
		const onBlur = vi.fn();
		const onFocusChange = vi.fn();
		let focusProps: any;

		function Reader(props: { isDisabled?: boolean }) @{
			focusProps = useFocus({ isDisabled: props.isDisabled, onFocus, onBlur, onFocusChange }).focusProps;

			<button {...focusProps} class="target" />
		}

		const el = document.createElement('div');
		document.body.appendChild(el);
		const root = createRoot(el);
		act(() => root.render(<Reader />));
		const button = el.querySelector<HTMLElement>('.target')!;

		act(() => button.focus());
		expect(onFocus).toHaveBeenCalledTimes(1);
		expect(onFocusChange).toHaveBeenLastCalledWith(true);
		act(() => button.blur());
		expect(onBlur).toHaveBeenCalledTimes(1);
		expect(onFocusChange).toHaveBeenLastCalledWith(false);

		act(() => root.render(<Reader isDisabled />));
		expect(focusProps.onFocus).toBeUndefined();
		expect(focusProps.onBlur).toBeUndefined();

		root.unmount();
		el.remove();
	});
});

describe('useFocusRing + useFocusVisible (DOM renderer)', () => {
	it('reports focus visibility only for keyboard modality', () => {
		function Reader() @{
			const { isFocused, isFocusVisible: visible, focusProps } = useFocusRing();

			<button {...focusProps} class="ring">{`f:${isFocused},v:${visible}`}</button>
		}

		const el = document.createElement('div');
		document.body.appendChild(el);
		const root = createRoot(el);
		act(() => root.render(<Reader />));
		const button = el.querySelector<HTMLElement>('.ring')!;
		const text = () => button.textContent;

		expect(text()).toBe('f:false,v:false');
		act(() => keydown('Tab'));
		expect(isFocusVisible()).toBe(true);
		act(() => button.focus());
		expect(text()).toBe('f:true,v:true');

		act(() => window.dispatchEvent(new PointerEvent('pointerdown')));
		expect(text()).toBe('f:true,v:false');
		expect(isFocusVisible()).toBe(false);

		act(() => button.blur());
		expect(text()).toBe('f:false,v:false');

		root.unmount();
		el.remove();
	});
});

describe('useFocusWithin (DOM renderer)', () => {
	it('tracks focus entering and leaving a subtree', () => {
		const onFocusWithin = vi.fn();
		const onBlurWithin = vi.fn();

		function Reader() @{
			const { focusWithinProps, isSubtreeTrackingSupported } = useFocusWithin({
				onFocusWithin,
				onBlurWithin,
			});

			expect(isSubtreeTrackingSupported).toBe(true);

			<div {...focusWithinProps} class="scope">
				<button class="a" />
				<button class="b" />
			</div>
		}

		const outside = document.createElement('button');
		document.body.appendChild(outside);
		const el = document.createElement('div');
		document.body.appendChild(el);
		const root = createRoot(el);
		act(() => root.render(<Reader />));
		const a = el.querySelector<HTMLElement>('.a')!;
		const b = el.querySelector<HTMLElement>('.b')!;

		act(() => a.focus());
		expect(onFocusWithin).toHaveBeenCalledTimes(1);
		expect(onBlurWithin).not.toHaveBeenCalled();

		// Moving focus between children stays "within".
		act(() => a.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: b })));
		expect(onBlurWithin).not.toHaveBeenCalled();

		act(() => a.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside })));
		expect(onBlurWithin).toHaveBeenCalledTimes(1);

		root.unmount();
		el.remove();
		outside.remove();
	});
});

describe('useLandmark (DOM renderer)', () => {
	it('cycles regions on F6 / Shift+F6', () => {
		function Main() @{
			const { landmarkProps } = useLandmark({ role: 'main', label: 'Content' });

			<div {...landmarkProps} class="main">
				<button class="stop-main" />
			</div>
		}

		function Nav() @{
			const { landmarkProps } = useLandmark({ role: 'navigation', label: 'Sections' });

			<div {...landmarkProps} class="nav">
				<button class="stop-nav" />
			</div>
		}

		const el = document.createElement('div');
		document.body.appendChild(el);
		const root = createRoot(el);
		act(() =>
			root.render(
				<div>
					<Nav />
					<Main />
				</div>,
			),
		);

		const navStop = el.querySelector<HTMLElement>('.stop-nav')!;
		const mainStop = el.querySelector<HTMLElement>('.stop-main')!;

		act(() => keydown('F6'));
		expect(document.activeElement).toBe(navStop);
		act(() => keydown('F6'));
		expect(document.activeElement).toBe(mainStop);
		act(() => keydown('F6', { shiftKey: true }));
		expect(document.activeElement).toBe(navStop);

		root.unmount();
		el.remove();
	});
});

describe('FocusScope (DOM renderer)', () => {
	it('reports all behavior flags as supported capabilities', () => {
		expect(getFocusScopeCapabilities()).toEqual({
			contain: true,
			autoFocus: true,
			restoreFocus: true,
		});
	});

	it('auto-focuses inside, wraps Tab, contains focus, and restores on unmount', () => {
		const before = document.createElement('button');
		document.body.appendChild(before);
		before.focus();
		const el = document.createElement('div');
		document.body.appendChild(el);
		const root = createRoot(el);

		act(() =>
			root.render(
				<FocusScope contain restoreFocus autoFocus>
					<button class="a" />
					<button class="b" />
				</FocusScope>,
			),
		);

		const a = el.querySelector<HTMLElement>('.a')!;
		const b = el.querySelector<HTMLElement>('.b')!;
		expect(document.activeElement).toBe(a);

		// Tab on the last stop wraps to the first; Shift+Tab wraps backward.
		b.focus();
		b.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
		expect(document.activeElement).toBe(a);
		a.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
		expect(document.activeElement).toBe(b);

		// Focus landing outside the scope is pulled back in.
		before.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
		expect(document.activeElement).toBe(b);

		act(() => root.unmount());
		expect(document.activeElement).toBe(before);

		el.remove();
		before.remove();
	});
});
