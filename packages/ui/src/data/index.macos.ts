// @octane-xplat/ui/data on macOS — same names as the shared data barrel;
// useStore and platformQueryStorage bind to the AppKit leaves.
export { createStore } from './store'
export { useStore } from './useStore.macos.tsrx'

// Immutable collection data stores — shared implementations, no macOS leaf
export { useListData } from './use-list-data'
export { useTreeData } from './use-tree-data'
export { useAsyncList } from './use-async-list'

export { defineQuery, createQueryClient, createMemoryQueryStorage } from './query-cache'
export { useQuery$ } from './use-query'
export { platformQueryStorage } from './query-storage'

export { defineCursorQuery } from './cursor-query'
