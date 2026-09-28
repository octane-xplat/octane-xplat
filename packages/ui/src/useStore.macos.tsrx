import { useSyncExternalStore } from 'octane'
import type { ReadableStore } from './store'

export function useStore<T>(store: ReadableStore<T>): T {
	return useSyncExternalStore(store.subscribe, store.get)
}
