// Window size + orientation — native leaf. Screen.mainScreen gives DIPs;
// Application.orientationChangedEvent drives updates.
import { useEffect, useState } from 'octane';
import type { WindowSize } from './types';
import { Application, Screen } from '@nativescript/core';


function read(): WindowSize {
	const s = Screen.mainScreen;
	return {
		width: s.widthDIPs,
		height: s.heightDIPs,
		orientation: s.widthDIPs >= s.heightDIPs ? 'landscape' : 'portrait',
	};
}

export function useWindowSize(): WindowSize {
	const [size, setSize] = useState<WindowSize>(read);
	useEffect(() => {
		const update = () => setSize(read());
		Application.on(Application.orientationChangedEvent, update);
		return () => Application.off(Application.orientationChangedEvent, update);
	}, []);

	return size;
}
