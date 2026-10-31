import type { IconifyIcon, IconifyJSON } from '@iconify/types'
import { getIconData } from '@iconify/utils/lib/icon-set/get-icon'

const collections = new Map<string, IconifyJSON>()
const singles = new Map<string, IconifyIcon>()
const cache = new Map<string, IconifyIcon | undefined>()
const listeners = new Set<() => void>()
let revision = 0
const identifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Each component subscribes through ui's useStore, including retained native children.
/** External-store handle for icon components: bumps a revision counter when
 *  addCollection() lands so mounted icons re-resolve. Consumed internally
 *  via useStore; exposed for custom icon hosts. */
export const registry = {
	/** Monotonic revision counter — the useSyncExternalStore snapshot. */
	getSnapshot: (): number => revision,
	/** Register a change listener; returns the unsubscribe function. */
	subscribe(notify: () => void) {
		listeners.add(notify)
		return (): void => {
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

	notifyChanged()
}

/** `prefix:name` split and validation shared by addIcon/addIcons/resolveIcon. */
function iconNameParts(name: string): [string, string] | undefined {
	const parts = name.split(':')
	if (parts.length !== 2 || !parts.every((part) => identifier.test(part))) {
		return undefined
	}

	return [parts[0], parts[1]]
}

function notifyChanged(): void {
	cache.clear()
	revision++
	// Snapshot subscriptions so re-subscription during notification is deferred.
	// oxlint-disable-next-line unicorn/no-useless-spread
	for (const notify of [...listeners]) {
		notify()
	}
}

/**
 * Register a single `prefix:name` icon — the tree-shaken counterpart to
 * addCollection for data already in hand, such as `icons:prefix/name` module
 * values from the Vite plugin. A registered name shadows collection data for
 * the same name. Treat the supplied icon as immutable after registration.
 * @throws TypeError if the name is not `prefix:name` or the icon lacks a body.
 */
export function addIcon(name: string, icon: IconifyIcon): void {
	if (!iconNameParts(name) || !icon || typeof icon.body !== 'string') {
		throw new TypeError('Expected a `prefix:name` name and Iconify data with a string body')
	}

	singles.set(name, icon)
	notifyChanged()
}

/**
 * Register a record of `prefix:name` → IconifyIcon entries in one shot —
 * composes with `icons:prefix/name` imports:
 * `addIcons({ 'heroicons:x-mark': xMark, 'heroicons:plus': plus })`.
 * @throws TypeError if any key is not `prefix:name` or lacks a string body.
 */
export function addIcons(icons: Record<string, IconifyIcon>): void {
	if (!icons || typeof icons !== 'object') {
		throw new TypeError('Expected a record of `prefix:name` → IconifyIcon entries')
	}

	for (const [name, icon] of Object.entries(icons)) {
		if (!iconNameParts(name) || !icon || typeof icon.body !== 'string') {
			throw new TypeError(`Expected a \`prefix:name\` name and Iconify data with a string body: ${name}`)
		}

		singles.set(name, icon)
	}

	notifyChanged()
}

/** Resolve `prefix:name` — single-icon registrations first, then collection data including aliases and dimensions; missing/invalid names return undefined. */
export function resolveIcon(name: string): IconifyIcon | undefined {
	if (cache.has(name)) {
		return cache.get(name)
	}

	const parts = iconNameParts(name)
	if (!parts) {
		return undefined
	}

	const single = singles.get(name)
	if (single) {
		return single
	}

	const collection = collections.get(parts[0])
	const icon = collection ? (getIconData(collection, parts[1]) ?? undefined) : undefined
	cache.set(name, icon)
	return icon
}
