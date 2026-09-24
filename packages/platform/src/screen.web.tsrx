// Window size + orientation — web leaf.
import { useEffect, useState } from 'octane';

export interface WindowSize {
	width: number;
	height: number;
	orientation: 'portrait' | 'landscape';
}

function read(): WindowSize {
	return {
		width: window.innerWidth,
		height: window.innerHeight,
		orientation: window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait',
	};
}

export function useWindowSize(): WindowSize {
	const [size, setSize] = useState<WindowSize>(read);
	useEffect(() => {
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
