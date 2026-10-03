/** Resizable `autoSaveId` persistence — localStorage on web. Three legacy
 *  formats are read like upstream's: a bare number, `{ size }` alone, and
 *  `{ size, isCollapsed }` where size may be null while collapsed. */
export interface PersistedResizableState {
	size?: number | null
	isCollapsed?: boolean
}

export function loadResizableState(key: string): PersistedResizableState | null {
	try {
		const raw = window.localStorage.getItem(key)
		if (raw == null) {
			return null
		}

		const parsed = JSON.parse(raw)
		if (typeof parsed === 'number') {
			return { size: parsed }
		}

		if (typeof parsed === 'object' && parsed !== null) {
			const size = typeof parsed.size === 'number' ? parsed.size : null
			return { size, isCollapsed: parsed.isCollapsed === true }
		}

		return null
	} catch {
		return null
	}
}

export function persistResizableState(key: string, state: PersistedResizableState): void {
	try {
		window.localStorage.setItem(key, JSON.stringify(state))
	} catch {
		// Quota/SSR failures are non-fatal — persistence is best-effort.
	}
}
