import { createStore, useStore } from '@octane-xplat/ui';

/** Module-scope store — the one thing that CAN cross Octane roots.
 *  Pushed pages, modals, and sheets each get a fresh root, so context
 *  never crosses; a store + useStore does. Gallery reads `lastDemo` after
 *  pop; DemoDetail writes it on mount — the text updates reactively across
 *  the navigation boundary. Per-reader subscription is required anyway on
 *  the universal renderer (retained children don't re-run — decision #27). */

const lastDemoStore = createStore<string | null>(null);

export function setLastDemo(id: string) {
	lastDemoStore.set(id);
}

export function useLastDemo(): string | null {
	return useStore(lastDemoStore);
}
