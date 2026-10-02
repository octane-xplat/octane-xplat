import type { IconifyIcon, IconifyJSON } from '@iconify/types'
import { getIconData } from '@iconify/utils/lib/icon-set/get-icon'

const collections = new Map<string, IconifyJSON>()
const cache = new Map<string, IconifyIcon | undefined>()
const listeners = new Set<() => void>()
let revision = 0
const identifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Each component subscribes through ui's useStore, including retained native children.
export const registry = {
	get: () => revision,
	subscribe(notify: () => void) {
		listeners.add(notify)
		return () => {
			listeners.delete(notify)
		}
	},
}

/**
 * Register trusted, bundled Iconify JSON. Replaces the collection with the same
 * prefix and updates mounted Icons. No fetching or default set is provided.
 * Treat the supplied JSON as immutable after registration.
 * @throws TypeError if the prefix or icons dictionary is missing/invalid.
 */
export function addCollection(collection: IconifyJSON): void {
	if (
		!collection ||
		typeof collection.prefix !== 'string' ||
		!identifier.test(collection.prefix) ||
		!collection.icons ||
		typeof collection.icons !== 'object' ||
		Array.isArray(collection.icons)
	) {
		throw new TypeError('Expected Iconify JSON with a non-empty prefix and icons dictionary')
	}

	// Iconify resolves dictionary entries by indexing: discard inherited Object members.
	collections.set(collection.prefix, {
		...collection,
		icons: Object.assign(Object.create(null), collection.icons),
		aliases: Object.assign(Object.create(null), collection.aliases),
	})

	cache.clear()
	revision++
	// Snapshot subscriptions so re-subscription during notification is deferred.
	// oxlint-disable-next-line unicorn/no-useless-spread
	for (const notify of [...listeners]) {
		notify()
	}
}

/** Resolve `prefix:name`, including aliases and collection dimensions; missing/invalid names return undefined. */
export function resolveIcon(name: string): IconifyIcon | undefined {
	if (cache.has(name)) {
		return cache.get(name)
	}

	const parts = name.split(':')
	if (parts.length !== 2 || !parts.every((part) => identifier.test(part))) {
		return undefined
	}

	const collection = collections.get(parts[0])
	const icon = collection ? (getIconData(collection, parts[1]) ?? undefined) : undefined
	cache.set(name, icon)
	return icon
}
