import { ApplicationSettings } from '@nativescript/core'

/** Resizable `autoSaveId` persistence — NativeScript ApplicationSettings. */
export interface PersistedResizableState {
	size?: number | null
	isCollapsed?: boolean
}

export function loadResizableState(key: string): PersistedResizableState | null {
	try {
		if (!ApplicationSettings.hasKey(key)) {return null}
		const raw = ApplicationSettings.getString(key)
		if (raw == null) {return null}
		const parsed = JSON.parse(raw)
		if (typeof parsed === 'number') {return { size: parsed }}
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
		ApplicationSettings.setString(key, JSON.stringify(state))
	} catch {
		// Persistence is best-effort.
	}
}
