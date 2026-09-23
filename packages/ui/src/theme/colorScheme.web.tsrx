import { useSyncExternalStore } from 'octane';

export type { ColorScheme } from '../props';
import type { ColorScheme } from '../props';

export function getColorScheme(): ColorScheme {
	return typeof matchMedia === 'function'
		&& matchMedia('(prefers-color-scheme: dark)').matches
		? 'dark' : 'light';
}

function subscribe(cb: () => void): () => void {
	const mq = matchMedia('(prefers-color-scheme: dark)');
	mq.addEventListener('change', cb);
	return () => mq.removeEventListener('change', cb);
}

export function useColorScheme(): ColorScheme {
	return useSyncExternalStore(subscribe, getColorScheme);
}
