// Safe-area insets — native leaf. Reads the window's safe area after layout;
// falls back to zero before it exists.
import { useEffect, useState } from 'octane';
import type { Insets } from './types';
import { Application } from '@nativescript/core';


function readInsets(): Insets {
	if (Application.ios) {
		const v = Application.ios.rootController?.view;
		const i = v?.safeAreaInsets;
		if (i) return { top: i.top, bottom: i.bottom, left: i.left, right: i.right };
	}

	// Android: WindowInsets need an attached view — return 0 until a screen
	// supplies its own; orientation change re-reads.
	return { top: 0, bottom: 0, left: 0, right: 0 };
}

export function useSafeAreaInsets(): Insets {
	const [insets, setInsets] = useState<Insets>(readInsets);
	useEffect(() => {
		const update = () => setInsets(readInsets());
		Application.on(Application.orientationChangedEvent, update);
		return () => Application.off(Application.orientationChangedEvent, update);
	}, []);

	return insets;
}
