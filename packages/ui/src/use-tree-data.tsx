import { useRef } from 'octane';
import { createTreeData, type TreeData, type TreeDataOptions } from './tree-data';
import { useStore } from './use-store';

/**
 * React Aria useTreeData counterpart: one immutable tree store per component.
 * Raw values are processed into nodes (key/parentKey/value/children) and
 * every mutator commits a fresh tree, re-rendering subscribed readers.
 */
export function useTreeData<T>(options: TreeDataOptions<T> = {}): TreeData<T> {
	const ref = useRef<TreeData<T> | null>(null);
	if (ref.current === null) {
		ref.current = createTreeData(options);
	}

	useStore(ref.current);
	return ref.current;
}
