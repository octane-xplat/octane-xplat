// Ported from react-native-nano-icons (MIT, © Software Mansion) — pipeline
// config types and small fs helpers.
import fs from 'node:fs'

export type PipelineConfig = {
	fontFamily: string
	upm: number
	safeZone: number
	startUnicode: number
	web?: boolean
}

export function ensureEmptyDir(dir: string): void {
	if (fs.existsSync(dir)) {
		fs.rmSync(dir, { recursive: true, force: true })
	}

	fs.mkdirSync(dir, { recursive: true })
}

/** Create directory if it does not exist; do not remove existing contents (for shared output dirs). */
export function ensureDir(dir: string): void {
	fs.mkdirSync(dir, { recursive: true })
}

export function writeFileAtomic(filePath: string, data: string | Uint8Array): void {
	const tmpPath = `${filePath}.tmp`
	fs.writeFileSync(tmpPath, data)
	fs.renameSync(tmpPath, filePath)
}
