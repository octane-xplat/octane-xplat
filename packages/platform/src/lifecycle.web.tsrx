// App lifecycle — web leaf. visibilitychange ↔ 'active'/'background';
// pagehide maps to 'inactive' (the unload-approaching state).
import { useEffect, useState } from 'octane';
import type { AppState } from './types';

export function useAppState(): AppState {
	const [state, setState] = useState<AppState>('active');
	useEffect(() => {
		const onVis = () => setState(document.visibilityState === 'visible' ? 'active' : 'background');
		const onHide = () => setState('inactive');
		document.addEventListener('visibilitychange', onVis);
		window.addEventListener('pagehide', onHide);
		window.addEventListener('pageshow', onVis);
		return () => {
			document.removeEventListener('visibilitychange', onVis);
			window.removeEventListener('pagehide', onHide);
			window.removeEventListener('pageshow', onVis);
		};
	}, []);

	return state;
}

/** Browser back is already real history — nothing to intercept on web. */
export function useBackHandler(_fn: () => boolean): void {}
