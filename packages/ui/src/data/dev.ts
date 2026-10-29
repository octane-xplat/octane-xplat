/** Opt-in development inspection. Import and call behind the app's development gate. */
import { registerDevAction } from '@octane-xplat/platform/dev-actions'
import type { QueryClient } from './query-cache'
import {
	QUERY_INSPECTION,
	type QueryInspectionSnapshot,
	type QueryInspectionEvent,
} from './query-inspection'

export type {
	QueryInspectionEntry,
	QueryInspectionEvent,
	QueryInspectionSnapshot,
	QueryEventType,
	QueryTrigger,
} from './query-inspection'

export interface QueryInspectorOptions {
	/** Explicit public diagnostic labels, never derived from keys or selections. */
	readonly labels?: readonly {
		readonly definition: object
		readonly label: string
	}[]
	/** Maximum retained events. Zero keeps snapshots only. @default 100 */
	readonly eventLimit?: number
}

export interface QueryInspector {
	/** A fresh metadata snapshot; reading does not fetch, subscribe signals or acquire leases. */
	snapshot(): QueryInspectionSnapshot
	/** Release collection and retained events. Cache lifetime is unchanged. */
	dispose(): void
}

/**
 * Inspect one explicit client. No global registry or event history is installed
 * by createQueryClient. Labels must be static, non-sensitive names.
 * @example
 * if (import.meta.env.DEV) {
 *   const { inspectQueryClient } = await import('@octane-xplat/ui/data/dev')
 *   const inspector = inspectQueryClient(queries, { labels: [{ definition: users, label: 'users.detail' }] })
 *   console.log(inspector.snapshot())
 * }
 */
export function inspectQueryClient(
	client: QueryClient,
	options: QueryInspectorOptions = {},
): QueryInspector {
	const limit = options.eventLimit ?? 100
	if (!Number.isSafeInteger(limit) || limit < 0 || limit > 1000) {
		throw new TypeError('eventLimit must be an integer from 0 to 1000')
	}
	const labels = new WeakMap<object, string>()
	for (const { definition, label } of options.labels ?? []) {
		if (!/^[a-zA-Z][a-zA-Z0-9._-]{0,63}$/.test(label)) {
			throw new TypeError('Query diagnostic labels must be static names of at most 64 characters')
		}

		labels.set(definition, label)
	}
	const source = client[QUERY_INSPECTION]
	const events: QueryInspectionEvent[] = []
	let disposed = false
	const detach = source.subscribe((event) => {
		if (limit === 0) {
			return
		}
		events.push(event)
		if (events.length > limit) {
			events.splice(0, events.length - limit)
		}
	})
	return {
		snapshot() {
			if (disposed) {
				throw new Error('Query inspector is disposed')
			}
			const snapshot = source.snapshot((definition) => labels.get(definition))
			return Object.freeze({
				...snapshot,
				queries: Object.freeze(snapshot.queries.map((entry) => Object.freeze(entry))),
				events: Object.freeze([...events]),
			})
		},
		dispose() {
			disposed = true
			detach()
			events.length = 0
		},
	}
}

/**
 * Expose one inspector over the existing development-action transport. The CLI
 * still requires an exact app instance and registry revision. Dispose this
 * registration before its inspector (also on hot reload).
 * @example
 * const registration = registerQueryInspection(inspector)
 * // xplat actions list --json; invoke the returned queries.inspect.* action.
 * // On teardown: registration.dispose(); inspector.dispose()
 */
export function registerQueryInspection(inspector: QueryInspector): {
	readonly actionId: string
	dispose(): void
} {
	const actionId = `queries.inspect.${inspector.snapshot().clientId}`
	const handle = registerDevAction({
		id: actionId,
		title: 'Inspect query cache metadata',
		description:
			'Read one query client snapshot and bounded events. Contains no keys, data, account scopes or error messages.',
		input: {},
		// JSON text preserves the fixed metadata contract without opening arbitrary object fields.
		result: { fields: { snapshot: { type: 'string' } } },
		effects: {
			summary: 'Reads query metadata; does not change application state',
		},
		execution: { concurrency: 'overlap', retryable: true },
		run: () => ({ snapshot: JSON.stringify(inspector.snapshot()) }),
	})
	return { actionId, dispose: () => handle.dispose() }
}
