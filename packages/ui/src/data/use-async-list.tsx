import { useEffect, useRef } from 'octane'
import { createAsyncListData, type AsyncListData, type AsyncListOptions } from './async-list'

import { useStore } from './use-store'

/**
 * React Aria useAsyncList counterpart: managed async list state with
 * loading/error tracking, abortable reloads, cursor pagination, and client
 * or server sort. The initial load fires on mount; setFilterText and sort()
 * trigger reloads thereafter.
 */
export function useAsyncList<T, C = string>(options: AsyncListOptions<T, C>): AsyncListData<T> {
	const ref = useRef<AsyncListData<T> | null>(null)
	if (ref.current === null) {
		ref.current = createAsyncListData(options)
	}

	useStore(ref.current)
	useEffect(() => {
		void ref.current!.reload()
	}, [])

	return ref.current
}
