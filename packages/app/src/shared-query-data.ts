import {
	createQueryClient,
	createStore,
	defineQuery,
	defineCursorQuery,
	platformQueryStorage,
	type QueryEnvironment,
	type QueryStorageAdapter,
} from '@octane-xplat/ui/data'

export type DemoUser = { id: string; name: string; revision: number }

// This maintained example uses public synthetic records, never real accounts.
// A real app replaces this transport with its server and passes signal to it.
const accounts = new Map<string, Map<string, DemoUser>>()
function records(account: string) {
	let users = accounts.get(account)
	if (!users) {
		users = new Map(
			Array.from({ length: 9 }, (_, index) => {
				const id = String(index + 1)
				return [id, { id, name: `${account} user ${id}`, revision: 1 }]
			}),
		)
		accounts.set(account, users)
	}
	return users
}

function delay(signal: AbortSignal, milliseconds: number): Promise<void> {
	return new Promise((resolve, reject) => {
		const abort = () => {
			clearTimeout(timer)
			signal.removeEventListener('abort', abort)
			reject(Object.assign(new Error('Demo request cancelled'), { name: 'AbortError' }))
		}
		const timer = setTimeout(() => {
			signal.removeEventListener('abort', abort)
			resolve()
		}, milliseconds)
		signal.addEventListener('abort', abort, { once: true })
		if (signal.aborted) { abort() }
	})
}

/** Immutable account closure: definitions never consult mutable active-account state. */
export function createDemoSession(
	account: string,
	options: {
		storage?: QueryStorageAdapter
		environment?: QueryEnvironment
		latencyMs?: number
	} = {},
) {
	const queries = createQueryClient({
		namespace: `public-demo:${account}`,
		environment: options.environment,
	})
	const policy = {
		staleTimeMs: 60_000,
		retryDelayMs: 100,
		persist: { storage: options.storage ?? platformQueryStorage, version: 1, maxAgeMs: 86_400_000 },
	}
	const users = defineQuery(
		['demo-users'],
		async (id: string, { signal }) => {
			await delay(signal, options.latencyMs ?? 250)
			const user = records(account).get(id)
			if (!user) { throw new Error('Demo user not found') }
			return { ...user }
		},
		{ ...policy, compareAuthority: (incoming, current) => incoming.revision - current.revision },
	)
	const feed = defineCursorQuery(
		['demo-user-feed'],
		async (search: string, { cursor, signal }) => {
			await delay(signal, options.latencyMs ?? 250)
			const all = [...records(account).values()].filter((user) =>
				user.name.toLowerCase().includes(search.toLowerCase()),
			)
			return {
				items: all.slice(cursor, cursor + 3).map((user) => ({ ...user })),
				nextCursor: cursor + 3 < all.length ? cursor + 3 : undefined,
				previousCursor: cursor > 0 ? Math.max(0, cursor - 3) : undefined,
			}
		},
		{ ...policy, initialCursor: 0, maxPages: 3 },
	)

	return {
		account,
		queries,
		users,
		feed,
		async saveUser(id: string, name: string, rejectSave = false) {
			return queries.runOptimistic(users, id, async (operation, user$, { signal }) => {
				operation.set(user$, (current) => ({ ...current, name }))
				await delay(signal, options.latencyMs ?? 250)
				if (rejectSave) { throw new Error('Demo server rejected the rename') }
				const previous = records(account).get(id)!
				const receipt = { ...previous, name, revision: previous.revision + 1 }
				records(account).set(id, receipt)
				operation.adopt(receipt)
				// Explicit application reconciliation; no implicit list/detail normalization.
				queries.setQueriesData(feed, (previous) => ({
					...previous,
					pages: previous.pages.map((page) => ({
						...page,
						items: page.items.map((user) => (user.id === id ? receipt : user)),
					})),
				}))
				return receipt
			})
		},
	}
}

export type DemoSession = ReturnType<typeof createDemoSession>
/** App-owned public demo session; each component reader subscribes with useStore. */
export const demoSession = createStore(createDemoSession('Ada'))

/** Replace the whole boundary. Reopening an account can restore its own confirmed records. */
export async function replaceDemoSession(account: string) {
	const previous = demoSession.getSnapshot()
	demoSession.set(createDemoSession(account))
	await previous.queries.dispose()
}

// Development inspection follows the same session boundary as the screen.
if (import.meta.env.DEV) {
	let generation = 0
	let stop = () => {}
	const inspect = async () => {
		const revision = ++generation
		stop()
		stop = () => {}
		const session = demoSession.getSnapshot()
		const { inspectQueryClient, registerQueryInspection } =
			await import('@octane-xplat/ui/data/dev')
		if (revision !== generation) { return }
		const inspector = inspectQueryClient(session.queries, {
			labels: [
				{ definition: session.users, label: 'demo.users' },
				{ definition: session.feed, label: 'demo.feed' },
			],
		})
		const registration = registerQueryInspection(inspector)
		stop = () => {
			registration.dispose()
			inspector.dispose()
		}
	}
	const start = () => {
		void inspect().catch(() => {
			/* Diagnostics cannot interrupt the fixture. */
		})
	}
	const unsubscribe = demoSession.subscribe(start)
	start()
	import.meta.hot?.dispose(() => {
		generation++
		unsubscribe()
		stop()
	})
}
import.meta.hot?.dispose(() => {
	void demoSession.getSnapshot().queries.dispose()
})
