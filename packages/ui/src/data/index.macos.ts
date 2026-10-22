// @octane-xplat/ui/data on macOS — same names as the shared data barrel;
// useStore and platformQueryStorage bind to the AppKit leaves.
export { createStore } from '../store'
export type { Store, ReadableStore, StoreSnapshot } from '../store'
export { useStore } from '../useStore.macos.tsrx'

// Immutable collection data stores — shared implementations, no macOS leaf
export { useListData } from '../use-list-data'
export { useTreeData } from '../use-tree-data'
export { useAsyncList } from '../use-async-list'
export type { Key, Selection, ListData, ListDataOptions, ListSnapshot } from '../list-data'
export type {
	TreeData,
	TreeDataOptions,
	TreeNode,
	TreeNode as CollectionTreeNode,
	TreeSnapshot,
} from '../tree-data'

export type {
	AsyncListData,
	AsyncListLoadContext,
	AsyncListLoadResult,
	AsyncListOptions,
	AsyncListSnapshot,
	LoadingState,
	SortDescriptor,
} from '../async-list'

export { defineQuery, createQueryClient, createMemoryQueryStorage } from '../query-cache'
export { useQuery$ } from '../use-query'
export { platformQueryStorage } from '../query-storage'
export type {
	QueryEnvironment,
	QueryEnvironmentSnapshot,
	QueryUpdater,
	QueryDefinition,
	QueryClient,
	QueryClientOptions,
	QueryReader,
	QueryState,
	QueryKey,
	QueryKeyPart,
	QueryStorageAdapter,
	QueryPersistence,
	QueryOptions,
	QueryLoadContext,
	QueryFilter,
	QueryDisposeOptions,
} from '../query-cache'
