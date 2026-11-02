import { Windows } from '@octane-xplat/platform/windows'

/**
 * Windows preferences use ApplicationData.LocalSettings directly.
 * ApplicationSettings from the pinned core calls Values.HasKey, which the
 * NSWinRT projection does not expose on this host, so the leaf talks to the
 * IPropertySet surface itself. Writes are handed to the OS; no blocking
 * durability confirmation is exposed.
 *
 * @example
 * import { storage } from '@octane-xplat/platform'
 * storage.setString('draft', 'Passport')
 * const draft = storage.getString('draft')
 */
const values = (): any => {
	try {
		return Windows?.Storage?.ApplicationData?.Current?.LocalSettings?.Values
	} catch {
		return undefined
	}
}

const readEntry = (key: string): unknown => {
	const container = values()
	if (!container) return undefined
	try {
		const direct = container[key]
		if (direct !== undefined) return direct
	} catch {}
	// The projected indexer can miss keys the underlying map still holds.
	try {
		const iterator = container.First?.()
		while (iterator?.HasCurrent) {
			const current = iterator.Current
			if (current?.Key === key) return current?.Value
			if (!iterator.MoveNext?.()) break
		}
	} catch {}
	return undefined
}

const writeEntry = (key: string, value: string): void => {
	const container = values()
	if (!container) return
	if (typeof container.Insert === 'function') {
		try {
			container.Insert(key, value)
			return
		} catch {}
	}
	try {
		container[key] = value
	} catch {}
}

const removeEntry = (key: string): void => {
	const container = values()
	if (!container) return
	if (typeof container.Remove === 'function') {
		try {
			container.Remove(key)
			return
		} catch {}
	}
	try {
		delete container[key]
	} catch {}
}

export const storage = {
	getString: (key: string): string | null => {
		const value = readEntry(key)
		return value === undefined || value === null ? null : String(value)
	},
	setString: (key: string, value: string): void => {
		writeEntry(key, value)
	},
	remove: (key: string): void => {
		removeEntry(key)
	},
	/** False: Windows exposes no blocking commit confirmation through this host. */
	flush: (): boolean => false,
}
