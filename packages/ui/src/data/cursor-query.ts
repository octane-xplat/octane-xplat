import {
	canonicalQueryKey,
	defineQuery,
	type QueryDefinition,
	type QueryKey,
	type QueryKeyPart,
	type QueryLoadContext,
	type QueryOptions,
} from './query-cache'

/** A server page. Undefined cursors mean that direction has ended; null is a valid cursor. */
export interface CursorPage<T, C extends QueryKeyPart> {
	readonly items: readonly T[]
	readonly nextCursor?: C
	readonly previousCursor?: C
}

/** One shared feed record, including the exact parameters used for retained pages. */
export interface CursorQueryData<T, C extends QueryKeyPart> {
	readonly pages: readonly CursorPage<T, C>[]
	readonly pageParams: readonly C[]
	readonly nextCursor?: C
	readonly previousCursor?: C
	readonly hasNextPage: boolean
	readonly hasPreviousPage: boolean
}

/** Cursor request input. Every request uses the shared cache's abort signal. */
export interface CursorPageContext<C extends QueryKeyPart> {
	readonly cursor: C
	readonly signal: AbortSignal
	readonly direction: 'initial' | 'refresh' | 'next' | 'previous'
}

/** Cursor policies plus the usual shared-query policies. */
export interface CursorQueryOptions<T, C extends QueryKeyPart> extends QueryOptions<
	CursorQueryData<T, C>
> {
	readonly initialCursor: C
	/** Maximum retained pages; adding next/previous drops the opposite end. @default Infinity */
	readonly maxPages?: number
}

const CURSOR_QUERY: unique symbol = Symbol('cursor-query')
interface CursorEngine<A extends QueryKeyPart, T, C extends QueryKeyPart> {
	loadPage: (
		selection: A,
		context: CursorPageContext<C>,
	) => CursorPage<T, C> | PromiseLike<CursorPage<T, C>>
	initialCursor: C
	maxPages: number
}

/** A typed feed definition, usable with useQuery$, ensureData, and prefetch. */
export interface CursorQueryDefinition<
	A extends QueryKeyPart,
	T,
	C extends QueryKeyPart,
> extends QueryDefinition<A, CursorQueryData<T, C>> {
	readonly [CURSOR_QUERY]: CursorEngine<A, T, C>
}

function copyCursor<C extends QueryKeyPart>(cursor: C): C {
	return JSON.parse(canonicalQueryKey(cursor)) as C
}

function pack<T, C extends QueryKeyPart>(
	pages: readonly CursorPage<T, C>[],
	params: readonly C[],
	limit: number,
	direction: 'next' | 'previous',
): CursorQueryData<T, C> {
	if (pages.length > limit) {
		const start = direction === 'next' ? pages.length - limit : 0
		pages = pages.slice(start, start + limit)
		params = params.slice(start, start + limit)
	}
	const nextCursor = pages.at(-1)?.nextCursor
	const previousCursor = pages[0]?.previousCursor
	return Object.freeze({
		pages: Object.freeze([...pages]),
		pageParams: Object.freeze([...params]),
		nextCursor,
		previousCursor,
		hasNextPage: nextCursor !== undefined,
		hasPreviousPage: previousCursor !== undefined,
	})
}

async function page<A extends QueryKeyPart, T, C extends QueryKeyPart>(
	engine: CursorEngine<A, T, C>,
	selection: A,
	cursor: C,
	signal: AbortSignal,
	direction: CursorPageContext<C>['direction'],
): Promise<CursorPage<T, C>> {
	const loaded = await engine.loadPage(selection, { cursor: copyCursor(cursor), signal, direction })
	if (!loaded || !Array.isArray(loaded.items)) {
		throw new TypeError('A cursor page must contain an items array')
	}
	if (loaded.nextCursor !== undefined) {
		canonicalQueryKey(loaded.nextCursor)
	}
	if (loaded.previousCursor !== undefined) {
		canonicalQueryKey(loaded.previousCursor)
	}
	return Object.freeze({ ...loaded, items: Object.freeze([...loaded.items]) })
}

/**
 * Define one cached feed per selection. Refresh starts at the first retained
 * parameter and follows newly returned cursors sequentially, publishing only
 * after the entire retained window settles. Page loading never overlaps refresh.
 * @example
 * import { defineCursorQuery } from '@octane-xplat/ui/data'
 * const feed = defineCursorQuery(['feed'], async (tag: string, { cursor, signal }) => {
 *   const response = await fetch(`/api/feed?tag=${tag}&cursor=${cursor}`, { signal })
 *   if (!response.ok) throw new Error('Could not load feed')
 *   return response.json() as Promise<{ items: string[]; nextCursor?: string }>
 * }, { initialCursor: '', maxPages: 5 })
 */
export function defineCursorQuery<A extends QueryKeyPart, T, C>(
	key: QueryKey,
	loadPage: CursorEngine<A, T, C & QueryKeyPart>['loadPage'],
	options: CursorQueryOptions<T, C & QueryKeyPart>,
): CursorQueryDefinition<A, T, C & QueryKeyPart> {
	const { initialCursor, maxPages = Infinity, ...policy } = options
	if (maxPages !== Infinity && (!Number.isSafeInteger(maxPages) || maxPages < 1)) {
		throw new TypeError('maxPages must be a positive integer or Infinity')
	}
	const engine: CursorEngine<A, T, C & QueryKeyPart> = Object.freeze({
		loadPage,
		initialCursor: copyCursor(initialCursor),
		maxPages,
	})
	const definition = defineQuery(
		key,
		async (
			selection: A,
			{ signal, previous }: QueryLoadContext<CursorQueryData<T, C & QueryKeyPart>>,
		) => {
			const count = Math.max(previous?.pages.length ?? 1, 1)
			let cursor = previous?.pageParams.length ? previous.pageParams[0]! : engine.initialCursor
			const pages: CursorPage<T, C & QueryKeyPart>[] = []
			const params: (C & QueryKeyPart)[] = []
			for (let index = 0; index < count; index++) {
				if (params.some((param) => canonicalQueryKey(param) === canonicalQueryKey(cursor))) {
					throw new Error('A cursor refresh repeated a page parameter')
				}

				params.push(copyCursor(cursor))
				const next = await page(engine, selection, cursor, signal, previous ? 'refresh' : 'initial')
				pages.push(next)
				if (next.nextCursor === undefined) {
					break
				}

				cursor = next.nextCursor
			}
			return pack(pages, params, maxPages, 'next')
		},
		policy,
	)
	return Object.freeze({ ...definition, [CURSOR_QUERY]: engine })
}

/** @internal Build one page operation for the cache's existing request scheduler. */
export function cursorPageLoader<A extends QueryKeyPart, T, C extends QueryKeyPart>(
	definition: CursorQueryDefinition<A, T, C>,
	direction: 'next' | 'previous',
): QueryDefinition<A, CursorQueryData<T, C>>['load'] {
	const engine = definition[CURSOR_QUERY]
	if (!engine) {
		throw new TypeError('Use defineCursorQuery for page operations')
	}
	return async (selection, { signal, previous }) => {
		if (!previous) {
			throw new Error('Load the initial cursor page first')
		}
		const cursor = direction === 'next' ? previous.nextCursor : previous.previousCursor
		if (cursor === undefined) {
			return previous
		}
		if (
			previous.pageParams.some((param) => canonicalQueryKey(param) === canonicalQueryKey(cursor))
		) {
			throw new Error('A cursor query repeated a retained page parameter')
		}
		const loaded = await page(engine, selection, cursor, signal, direction)
		return direction === 'next'
			? pack(
					[...previous.pages, loaded],
					[...previous.pageParams, copyCursor(cursor)],
					engine.maxPages,
					direction,
				)
			: pack(
					[loaded, ...previous.pages],
					[copyCursor(cursor), ...previous.pageParams],
					engine.maxPages,
					direction,
				)
	}
}
