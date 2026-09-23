import { useSyncExternalStore } from 'octane';
import { Application } from '@nativescript/core';

export type { ColorScheme } from '../props';
import type { ColorScheme } from '../props';

export function getColorScheme(): ColorScheme {
	// systemAppearance() is deprecated in favor of primaryWindow, but the
	// primary window isn't guaranteed during early boot — fall back.
	return Application.primaryWindow?.systemAppearance?.()
		?? (Application as any).systemAppearance?.()
		?? 'light';
}

function subscribe(cb: () => void): () => void {
	const h = () => cb();
	Application.on('systemAppearanceChanged', h);
	return () => Application.off('systemAppearanceChanged', h);
}

/** Reactive system appearance — 'light' | 'dark', re-renders on OS change. */
export function useColorScheme(): ColorScheme {
	return useSyncExternalStore(subscribe, getColorScheme);
}
