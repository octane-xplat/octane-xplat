import { useEffect, useState } from 'octane';
import { Application } from '@nativescript/core';

export interface SafeAreaInsets { top: number; right: number; bottom: number; left: number; }

function measure(): SafeAreaInsets {
	const view = Application.ios?.rootController?.view;
	const insets = view?.safeAreaInsets;
	if (insets) return { top: insets.top, right: insets.right, bottom: insets.bottom, left: insets.left };
	// Android reports zero until a View-backed WindowInsets implementation is added.
	return { top: 0, right: 0, bottom: 0, left: 0 };
}

/** Reads the root view's insets; Android and pre-attachment reads may be zero. */
export function useSafeAreaInsets(): SafeAreaInsets {
	const [insets, setInsets] = useState<SafeAreaInsets>(measure);
	useEffect(() => {
		const update = () => setInsets(measure());
		Application.on(Application.orientationChangedEvent, update);
		update();
		return () => {
			Application.off(Application.orientationChangedEvent, update);
		};
	}, []);
	return insets;
}
