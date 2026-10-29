export type Platform = 'ios' | 'android' | 'macos' | 'linux' | 'windows'
export type HashSource =
	| { type: 'file' | 'dir'; filePath: string; reasons: string[] }
	| { type: 'contents'; id: string; contents: string; reasons: string[] }
/** Input contents are deliberately omitted; output contains paths/IDs and hashes only. */
export type FingerprintSource = (
	| { type: 'file'; filePath: string }
	| { type: 'contents'; id: string }
) & { reasons: string[]; hash: string | null }
export interface Fingerprint {
	sources: FingerprintSource[]
	hash: string
}
export type FingerprintDiffItem =
	| { op: 'added'; addedSource: FingerprintSource }
	| { op: 'removed'; removedSource: FingerprintSource }
	| { op: 'changed'; beforeSource: FingerprintSource; afterSource: FingerprintSource }
export interface Options {
	platforms?: Platform[]
	/** SHA-256 is fixed for the versioned native compatibility contract. */
	hashAlgorithm?: 'sha256'
	/** Applied to extraSources. Excluding an automatic native input fails explicitly. */
	ignorePaths?: string[]
	extraSources?: HashSource[]
	/** Declared SDK/compiler/build variables that affect native output. No host paths or secrets. */
	toolchain?: Record<string, string>
	/** Resolved NativeScript configuration from its prepare hook; evaluated from disk otherwise. */
	nativeConfig?: Record<string, unknown>
}
export type Config = Options
