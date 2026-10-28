import { host } from './appkit-host'

async function writeText(value: string): Promise<boolean> {
	try {
		return await host().writeClipboard?.(value) ?? false
	} catch {
		return false
	}
}
async function readText(): Promise<string | null> {
	try {
		return await host().readClipboard?.() ?? null
	} catch {
		return null
	}
}

/** AppKit text clipboard. Copy requires a writer, independently of read
 * access; operational failures keep the shared false/null result contract. */
export const clipboard = {
	get canCopy(): boolean {
		try {
			return typeof host().writeClipboard === 'function'
		} catch {
			return false
		}
	},
	writeText,
	readText,
	write: writeText,
	read: readText,
}
