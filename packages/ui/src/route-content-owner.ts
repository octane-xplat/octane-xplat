import type { ContentOwner } from './owned-content'

const owners = new Map<string, ContentOwner[]>()

/** Scope registrations are stacked so removing an inner outlet restores its parent. */
export function registerRouteContentOwner(stack: string, owner: ContentOwner) {
	const entries = owners.get(stack) ?? []
	entries.push(owner)
	owners.set(stack, entries)
	return () => {
		const current = owners.get(stack)?.filter((entry) => entry !== owner) ?? []
		if (current.length) owners.set(stack, current)
		else owners.delete(stack)
	}
}

export function routeContentOwner(stack: string): ContentOwner | undefined {
	return owners.get(stack)?.findLast((owner) => !owner.disposed)
}
