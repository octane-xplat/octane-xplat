/** Result of `xplat workshop list` — what discovery found for a target. */
export interface WorkshopListResult {
	/** Discovered story entries (id, title, applicability, capabilities). */
	entries: unknown[]
	/** Discovery problems; non-json runs also throw a WorkshopUsageError listing them. */
	diagnostics: { file: string; exportName?: string; message: string }[]
}

/** Result of `xplat workshop doctor` — per-target prerequisite health. */
export interface WorkshopDoctorReport {
	/** Consumer package root the report was computed against. */
	root: string
	/** Per-target qualification: backend name, resolvable requirements, and status. */
	targets: Record<
		string,
		{
			backend: string
			requirements: Record<string, boolean>
			status: string
			note?: string
			executionHost?: { required: string; current: string; reachable: boolean }
			qualification?: 'unverified'
		}
	>
}

/** User-facing usage failure — bad cwd, unknown target, missing prerequisites. */
export class WorkshopUsageError extends Error {}

/** `xplat workshop list` — prints discovered stories and returns them. Throws WorkshopUsageError when diagnostics exist (non-json mode). */
export declare function workshopList(options?: {
	/** Consumer package root; defaults to process.cwd(). */
	cwd?: string
	/** Render target to filter applicability by. Default 'web'. */
	target?: string
	/** Print the machine-readable result instead of a table. */
	json?: boolean
}): Promise<WorkshopListResult>

/** `xplat workshop doctor` — prints/returns per-target prerequisite status. */
export declare function workshopDoctor(options?: {
	/** Consumer package root; defaults to process.cwd(). */
	cwd?: string
	/** Print the machine-readable report instead of a table. */
	json?: boolean
}): Promise<WorkshopDoctorReport>

/** `xplat workshop init` — scaffolds workshop.config.ts and a sample story; existing files are never overwritten. */
export declare function workshopInit(options?: {
	/** Consumer package root; defaults to process.cwd(). */
	cwd?: string
	/** Also add a "workshop" script to package.json. Default true. */
	scripts?: boolean
}): Promise<{ created: string[]; skipped: string[] }>

/** `xplat workshop dev` — boots the target's dev path (Vite server for web, native launch for ios/android, AppKit/GTK hosts for macos/linux). The resolved value varies by target. */
export declare function workshopDev(options?: {
	/** Consumer package root; defaults to process.cwd(). */
	cwd?: string
	/** Render target. Default 'web'. */
	target?: string
	/** Story id to open on load. */
	story?: string
	/** Dev-server port (web only — mobile uses the consumer's native Vite config). */
	port?: number
	/** Device/emulator specifier for mobile targets. */
	device?: string
}): Promise<unknown>

/**
 * Shared dev-server seam for DOM targets — the caller owns process
 * lifecycle. Exported so qualification harnesses can boot the exact
 * production wiring.
 */
export declare function startWorkshopServer(options?: {
	/** Consumer package root. */
	root?: string
	/** Loaded workshop config. */
	config?: object
	/** Render target. */
	target?: string
	/** Story id to open on load. */
	story?: string
	/** Dev-server port (strict). */
	port?: number
}): Promise<{ server: unknown; url: string }>

/** Locate the nearest workshop config file under `root`; null when absent. */
export declare function findConfigFile(root: string): string | null
/** Load the workshop config via Vite's config loader; `{ config: {}, file: null }` when absent. */
export declare function loadWorkshopConfig(
	root: string,
): Promise<{ config: object; file: string | null }>
