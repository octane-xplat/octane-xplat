// Window size + orientation — desktop webviews follow the owning native window;
// browsers use window geometry and DOM resize events.
import { useEffect, useState } from 'octane';
import type { WindowSize } from './types';
import { desktopHostBootstrap, desktopHostClient } from './host-runtime.web';

function read(): WindowSize {
	return {
		width: window.innerWidth,
		height: window.innerHeight,
		orientation: window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait',
	};
}

export function useWindowSize(): WindowSize {
	const bootstrap = desktopHostBootstrap();
	const [size, setSize] = useState<WindowSize>(bootstrap?.windowSize ?? read);
	useEffect(() => {
		const host = desktopHostClient();
		if (host) {
			return host.on('window.resize', setSize);
		}

		const update = () => setSize(read());
		window.addEventListener('resize', update);
		window.addEventListener('orientationchange', update);
		return () => {
			window.removeEventListener('resize', update);
			window.removeEventListener('orientationchange', update);
		};
	}, []);

	return size;
}
