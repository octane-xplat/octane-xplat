import { useSyncExternalStore } from 'octane';

/**
 * Global focus-modality tracking — React Aria's useFocusVisible. Reports
 * whether focus should be visibly indicated: true after non-modifier
 * keyboard input, false after pointer activation or window blur. Module
 * state is shared like store.ts — every reader subscribes via
 * useSyncExternalStore.
 */

let visible = false;
let attached = false;
const listeners = new Set<() => void>();

const set = (next: boolean) => {
	if (next === visible) {
		return;
	}

	visible = next;
	for (const listener of [...listeners]) {
		listener();
	}
};

const onKeyDown = (event: KeyboardEvent) => {
	if (!event.metaKey && !event.altKey && !event.ctrlKey) {
		set(true);
	}
};

const onPointer = () => set(false);
const onWindowBlur = () => set(false);

const attach = () => {
	if (attached || typeof window === 'undefined') {
		return;
	}

	attached = true;
	window.addEventListener('keydown', onKeyDown, true);
	window.addEventListener('pointerdown', onPointer, true);
	window.addEventListener('mousedown', onPointer, true);
	window.addEventListener('blur', onWindowBlur, true);
};

const subscribe = (notify: () => void) => {
	attach();
	listeners.add(notify);
	return () => {
		listeners.delete(notify);
	};
};

export function useFocusVisible(): { isFocusVisible: boolean } {
	attach();
	return { isFocusVisible: useSyncExternalStore(subscribe, () => visible) };
}

/** Non-hook read for render paths that already subscribe elsewhere. */
export function isFocusVisible(): boolean {
	attach();
	return visible;
}
