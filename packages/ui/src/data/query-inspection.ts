import type { QueryFetchDirection, QueryState } from './query-cache'

/** @internal Metadata boundary shared by the cache and the opt-in development entrypoint. */
export const QUERY_INSPECTION = Symbol('query-inspection')

export type QueryTrigger =
	| 'observe'
	| 'refresh'
	| 'ensure'
	| 'next'
	| 'previous'
	| 'poll'
	| 'resume'
	| 'reconnect'
	| 'invalidate'
	| 'write'
	| 'restore'

export type QueryEventType =
	| 'load'
	| 'success'
	| 'error'
	| 'retry'
	| 'pause'
	| 'invalidate'
	| 'write'
	| 'restore'
	| 'evict'
	| 'cancel'
	| 'dispose'

/** Only metadata crosses this boundary. Keys, selections, values and errors never do. */
export interface QueryInspectionEntry {
	readonly queryId: string
	readonly label?: string
	readonly status: QueryState['status']
	readonly fetchStatus: QueryState['fetchStatus']
	readonly fetchDirection?: QueryFetchDirection
	readonly stale: boolean
	readonly observers: number
	readonly leases: number
	readonly failureCount: number
	readonly updatedAtMs: number
	readonly lastTrigger?: QueryTrigger
}

export interface QueryInspectionEvent {
	readonly clientId: string
	readonly queryId?: string
	readonly type: QueryEventType
	readonly atMs: number
}

export interface QueryInspectionSnapshot {
	readonly clientId: string
	readonly status: 'live' | 'disposed'
	readonly queries: readonly QueryInspectionEntry[]
	readonly events: readonly QueryInspectionEvent[]
}

/** @internal No event history exists until a development inspector subscribes. */
export interface QueryInspectionSource {
	snapshot(
		labelFor: (definition: object) => string | undefined,
	): Omit<QueryInspectionSnapshot, 'events'>
	subscribe(listener: (event: QueryInspectionEvent) => void): () => void
}
