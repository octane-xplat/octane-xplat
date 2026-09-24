// Window size + orientation — native leaf. Screen.mainScreen gives DIPs;
// Application.orientationChangedEvent drives updates.
import { useEffect, useState } from 'octane';
import { Application, Screen } from '@nativescript/core';

export interface WindowSize {
	width: number;
	height: number;
	orientation: 'portrait' | 'landscape';
}

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
