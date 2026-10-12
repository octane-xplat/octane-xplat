import { useRef } from 'octane';
import { createListData, type ListData, type ListDataOptions } from './list-data';
import { useStore } from './use-store';

/**
 * React Aria useListData counterpart: one immutable list store per component.
 * Mutations (insert/remove/move/update/setFilterText/setSelectedKeys) commit
 * fresh state and re-render every subscribed reader — on native that read
 * goes through useStore, the portable subscription rule.
 */
export function useListData<T>(options: ListDataOptions<T> = {}): ListData<T> {
	const ref = useRef<ListData<T> | null>(null);
	if (ref.current === null) {
		ref.current = createListData(options);
	}

	useStore(ref.current);
	return ref.current;
}
