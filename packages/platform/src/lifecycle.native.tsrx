// App lifecycle — native leaf. Application suspend/resume/exit events map
// onto the shared AppState vocabulary; activityBackPressed feeds
// useBackHandler (Android hardware back).
import { useEffect, useState } from 'octane';
import { Application } from '@nativescript/core';
import type { AppState } from './types';

export function useAppState(): AppState {
	const [state, setState] = useState<AppState>('active');
	useEffect(() => {
		const onSuspend = () => setState('background');
		const onResume = () => setState('active');
		const onExit = () => setState('inactive');
		Application.on(Application.suspendEvent, onSuspend);
		Application.on(Application.resumeEvent, onResume);
		Application.on(Application.exitEvent, onExit);
		return () => {
			Application.off(Application.suspendEvent, onSuspend);
			Application.off(Application.resumeEvent, onResume);
			Application.off(Application.exitEvent, onExit);
		};
	}, []);
	return state;
}

/** Android hardware back — handler returns true when it consumed the press. */
export function useBackHandler(fn: () => boolean): void {
	useEffect(() => {
		if (!Application.android) return;
		const cb = (e: { cancel: boolean }) => {
			if (fn()) e.cancel = true;
		};
		Application.android.on(Application.AndroidApplication.activityBackPressedEvent, cb);
		return () => {
			Application.android.off(Application.AndroidApplication.activityBackPressedEvent, cb);
		};
	}, [fn]);
}
