import { useCallback, useEffect, useRef } from 'octane';

/** Options for the web roving-tabindex helper shared by Toolbar, TabList
 *  and NavHeadingMenu — the Astryx `useListFocus` equivalent scoped to what
 *  these components need. */
export interface ListFocusOptions {
	/** CSS selector matching the focusable stops. */
	itemSelector: string;
	/** Arrow axis — 'both' accepts vertical arrows too. */
	orientation?: 'horizontal' | 'vertical' | 'both';
	/** Own the single Tab stop: exactly one enabled item keeps tabIndex 0. */
	hasRovingTabIndex?: boolean;
	/** Called when Escape is pressed inside the container. */
	onEscape?: () => void;
}

function enabledStops(root: HTMLElement, selector: string): HTMLElement[] {
	return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
		(el) => !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true' && !el.hidden,
	);
}

/** Roving tabindex + arrow/Home/End navigation for a strip of stops.
 *  Web-only — pointer platforms have no composite-widget keyboard model. */
export function useListFocus<T extends HTMLElement = HTMLElement>(options: ListFocusOptions) {
	const ref = useRef<T | null>(null);
	const opts = useRef(options);
	opts.current = options;

	const focusItem = useCallback((item: HTMLElement | null) => {
		item?.focus();
	}, []);

	const focusAt = useCallback((index: number) => {
		const root = ref.current;
		if (!root) return;
		const stops = enabledStops(root, opts.current.itemSelector);
		if (!stops.length) return;
		const clamped = ((index % stops.length) + stops.length) % stops.length;
		stops[clamped]?.focus();
	}, []);

	const focusFirst = useCallback(() => focusAt(0), [focusAt]);
	const focusLast = useCallback(() => focusAt(-1), [focusAt]);

	const repairTabStop = useCallback(() => {
		const root = ref.current;
		if (!root || !opts.current.hasRovingTabIndex) return;
		const stops = enabledStops(root, opts.current.itemSelector);
		if (!stops.length) return;
		if (!stops.some((el) => el.tabIndex === 0)) {
			stops[0].tabIndex = 0;
		}
	}, []);

	// Repair the roving stop as stops mount/unmount or toggle disabled.
	useEffect(() => {
		const root = ref.current;
		if (!root || !opts.current.hasRovingTabIndex) return;
		repairTabStop();
		const mo = new MutationObserver(repairTabStop);
		mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['tabindex', 'disabled', 'aria-disabled', 'hidden'] });
		return () => mo.disconnect();
	}, [repairTabStop]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			const root = ref.current;
			if (!root) return;
			const { itemSelector, orientation = 'horizontal', onEscape } = opts.current;
			const horizontal = orientation === 'horizontal' || orientation === 'both';
			const vertical = orientation === 'vertical' || orientation === 'both';
			const stops = enabledStops(root, itemSelector);
			const active = (e.target as HTMLElement | null)?.closest?.(itemSelector) as HTMLElement | null;
			const index = active ? stops.indexOf(active) : -1;

			const move = (delta: number) => {
				e.preventDefault();
				const next = index < 0 ? (delta > 0 ? 0 : stops.length - 1) : index + delta;
				focusAt(next);
			};

			switch (e.key) {
				case 'ArrowRight': if (horizontal) move(1); break;
				case 'ArrowDown': if (vertical) move(1); break;
				case 'ArrowLeft': if (horizontal) move(-1); break;
				case 'ArrowUp': if (vertical) move(-1); break;
				case 'Home': if (index >= 0) { e.preventDefault(); focusFirst(); } break;
				case 'End': if (index >= 0) { e.preventDefault(); focusLast(); } break;
				case 'Escape': onEscape?.(); break;
			}
		},
		[focusAt, focusFirst, focusLast],
	);

	// Keep the roving stop in sync after clicks/programmatic focus: the
	// focused stop becomes the tabbable one.
	const handleFocus = useCallback(
		(e: FocusEvent) => {
			const root = ref.current;
			if (!root || !opts.current.hasRovingTabIndex) return;
			const target = (e.target as HTMLElement | null)?.closest?.(opts.current.itemSelector) as HTMLElement | null;
			if (!target) return;
			for (const el of enabledStops(root, opts.current.itemSelector)) {
				el.tabIndex = el === target ? 0 : -1;
			}
		},
		[],
	);

	return { listRef: ref, handleKeyDown, handleFocus, focusItem, focusAt, focusFirst, focusLast };
}
