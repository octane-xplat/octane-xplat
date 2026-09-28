import { useEffect, useState } from 'octane';
import { Application, Screen } from '@nativescript/core';

export interface SafeAreaInsets { top: number; right: number; bottom: number; left: number; }

function androidActivity(): any {
	return Application.android?.foregroundActivity ?? Application.android?.startActivity;
}

function readAndroidInsets(): SafeAreaInsets {
	const decorView = androidActivity()?.getWindow?.()?.getDecorView?.();
	const insets = decorView?.getRootWindowInsets?.();
	if (!insets) return { top: 0, right: 0, bottom: 0, left: 0 };

	const scale = Screen.mainScreen.scale || 1;
	if (android.os.Build.VERSION.SDK_INT >= 30) {
		const systemBars =
			android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout();

		const i = insets.getInsets(systemBars);
		return {
			top: i.top / scale,
			right: i.right / scale,
			bottom: i.bottom / scale,
			left: i.left / scale,
		};
	}

	return {
		top: insets.getSystemWindowInsetTop() / scale,
		right: insets.getSystemWindowInsetRight() / scale,
		bottom: insets.getSystemWindowInsetBottom() / scale,
		left: insets.getSystemWindowInsetLeft() / scale,
	};
}

function measure(): SafeAreaInsets {
	const view = Application.ios?.rootController?.view;
	const insets = view?.safeAreaInsets;
	if (insets) return { top: insets.top, right: insets.right, bottom: insets.bottom, left: insets.left };
	if (Application.android) return readAndroidInsets();
	return { top: 0, right: 0, bottom: 0, left: 0 };
}

/** Reads the root view's insets; Android and pre-attachment reads may be zero. */
export function useSafeAreaInsets(): SafeAreaInsets {
	const [insets, setInsets] = useState<SafeAreaInsets>(measure);
	useEffect(() => {
		const update = () => setInsets(measure());
		Application.on(Application.orientationChangedEvent, update);
		Application.on(Application.resumeEvent, update);
		update();
		return () => {
			Application.off(Application.orientationChangedEvent, update);
			Application.off(Application.resumeEvent, update);
		};
	}, []);

	return insets;
}
