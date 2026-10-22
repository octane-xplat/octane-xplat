import { createQueryClient, defineQuery } from '@octane-xplat/ui/data'

/** Public fixture records; real account clients belong to their session boundary. */
export const demoQueries = createQueryClient()
export const demoUsers = defineQuery(
	['demo-users'],
	async (id: string) => ({
		id,
		name: `User ${id}`,
	}),
	{ staleTimeMs: 60_000 },
)
