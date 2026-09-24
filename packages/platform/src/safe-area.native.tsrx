// Safe-area insets — native leaf. Reads the window's safe area after layout;
// falls back to zero before it exists.
import { useEffect, useState } from 'octane';
import { Application, Screen } from '@nativescript/core';

export interface Insets {
	top: number;
	bottom: number;
	left: number;
	right: number;
}

function readInsets(): Insets {
	if (Application.ios) {
		const w = Application.ios.window;
		const i = w?.safeAreaInsets;
		if (i) return { top: i.top, bottom: i.bottom, left: i.left, right: i.right };
	}
	if (Application.android) {
		const metrics = Application.android.startActivity?.resources?.displayMetrics;
		const top = metrics ? Screen.mainScreen.heightDIPs : 0;
		void top;
	}
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
