// App lifecycle — desktop webviews follow host window state; browsers keep
// visibility/page-lifecycle events.
import { useEffect, useState } from 'octane';
import type { AppState } from './types';
import { desktopHostBootstrap, desktopHostClient } from './host-runtime.web';

export function useAppState(): AppState {
	const bootstrap = desktopHostBootstrap();
	const [state, setState] = useState<AppState>(bootstrap?.appState ?? 'active');
	useEffect(() => {
		const host = desktopHostClient();
		if (host) {
			return host.on('app.state.change', setState);
		}

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
