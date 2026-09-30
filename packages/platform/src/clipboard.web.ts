// Clipboard — browser support is feature-detected; writes can still be denied
// by browser policy or permission state.
import { desktopHostClient, desktopHostSupports } from './host-runtime.web'

const canCopy =
	(typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') ||
	desktopHostClient() !== null

async function writeText(text: string): Promise<boolean> {
	const host = desktopHostClient()
	if (host && (await desktopHostSupports('clipboard', 'write'))) {
		try {
			return await host.call('clipboard', 'write', text)
		} catch {
			// Fall back to the browser API if the host call failed.
		}
	}

	try {
		await navigator.clipboard.writeText(text)
		return true
	} catch {
		return false
	}
}

async function readText(): Promise<string | null> {
	const host = desktopHostClient()
	if (host && (await desktopHostSupports('clipboard', 'read'))) {
		try {
			return await host.call('clipboard', 'read')
		} catch {
			// Fall back to the browser API if the host call failed.
		}
	}

	try {
		return await navigator.clipboard.readText()
	} catch {
		return null
	}
}

export const clipboard = {
	canCopy,
	writeText,
	readText,
	// Keep the original names available for existing consumers.
	write: writeText,
	read: readText,
}
