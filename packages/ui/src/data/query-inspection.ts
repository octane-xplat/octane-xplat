import type { QueryFetchDirection, QueryState } from './query-cache'

/** @internal Metadata boundary shared by the cache and the opt-in development entrypoint. */
export const QUERY_INSPECTION: unique symbol = Symbol('query-inspection')

/** What kicked off the last fetch — observation, explicit refresh, pagination, polling, or lifecycle. */
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

/** Event kinds in the inspection log — fetches, writes, invalidations, and lifecycle transitions. */
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
	/** Internal query identity (hashed key). */
	readonly queryId: string
	/** Developer-friendly label when the definition carries one. */
	readonly label?: string
	/** Data status: pending / success / error. */
	readonly status: QueryState['status']
	/** Fetch activity: fetching / paused / idle. */
	readonly fetchStatus: QueryState['fetchStatus']
	/** Which direction an in-flight fetch moves (forward/backward pagination). */
	readonly fetchDirection?: QueryFetchDirection
	/** Whether the entry needs a background refetch. */
	readonly stale: boolean
	/** Active observer count — drives fetch lifecycles. */
	readonly observers: number
	/** Lease count keeping the entry pinned in the cache. */
	readonly leases: number
	/** Consecutive failures since the last success. */
	readonly failureCount: number
	/** Epoch ms of the last successful write. */
	readonly updatedAtMs: number
	/** What kicked off the most recent fetch. */
	readonly lastTrigger?: QueryTrigger
}

/** One recorded event — emitted only while an inspector subscribes. */
export interface QueryInspectionEvent {
	/** Owning query client. */
	readonly clientId: string
	/** Query the event applies to; absent for client-level events. */
	readonly queryId?: string
	/** Event kind. */
	readonly type: QueryEventType
	/** Epoch ms when the event fired. */
	readonly atMs: number
}

/** Point-in-time inspection view — metadata only, never query values. */
export interface QueryInspectionSnapshot {
	/** Owning query client. */
	readonly clientId: string
	/** 'disposed' after the client tears down. */
	readonly status: 'live' | 'disposed'
	/** One entry per cached query. */
	readonly queries: readonly QueryInspectionEntry[]
	/** Recorded events since the inspector subscribed. */
	readonly events: readonly QueryInspectionEvent[]
}

/** @internal No event history exists until a development inspector subscribes. */
export interface QueryInspectionSource {
	/** Current entries — events arrive through `subscribe` instead. */
	snapshot(
		/** Resolves a definition object to its developer label. */
		labelFor: (definition: object) => string | undefined,
	): Omit<QueryInspectionSnapshot, 'events'>
	/** Starts event recording; returns an unsubscribe. */
	subscribe(listener: (event: QueryInspectionEvent) => void): () => void
}
