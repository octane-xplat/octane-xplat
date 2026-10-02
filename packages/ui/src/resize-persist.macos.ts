/** Resizable `autoSaveId` persistence — the AppKit host has no settings
 *  seam yet, so persistence is in-memory for the session. */
export interface PersistedResizableState {
	size?: number | null
	isCollapsed?: boolean
}

const memory = new Map<string, string>()

export function loadResizableState(key: string): PersistedResizableState | null {
	try {
		const raw = memory.get(key)
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
		memory.set(key, JSON.stringify(state))
	} catch {
		// best-effort
	}
}
