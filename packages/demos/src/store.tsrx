import { useSyncExternalStore } from 'octane';

/** Module-scope store — the one thing that CAN cross Octane roots.
 *  Pushed pages, modals, and sheets each get a fresh root, so context
 *  never crosses; a plain module + useSyncExternalStore does. Gallery
 *  reads `lastDemo` after pop; DemoDetail writes it on mount — the text
 *  updates reactively across the navigation boundary. */

let lastDemo: string | null = null;
const listeners = new Set<() => void>();

export function setLastDemo(id: string) {
	lastDemo = id;
	for (const l of listeners) l();
}

export function useLastDemo(): string | null {
	return useSyncExternalStore(
		(cb) => {
			listeners.add(cb);
			return () => { listeners.delete(cb); };
		},
		() => lastDemo,
	);
}
