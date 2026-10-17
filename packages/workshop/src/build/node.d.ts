export interface WorkshopListResult {
	entries: unknown[]
	diagnostics: { file: string; exportName?: string; message: string }[]
}

export interface WorkshopDoctorReport {
	root: string
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

export class WorkshopUsageError extends Error {}
export declare function workshopList(options?: {
	cwd?: string
	target?: string
	json?: boolean
}): Promise<WorkshopListResult>

export declare function workshopDoctor(options?: {
	cwd?: string
	json?: boolean
}): Promise<WorkshopDoctorReport>

export declare function workshopInit(options?: {
	cwd?: string
	scripts?: boolean
}): Promise<{ created: string[]; skipped: string[] }>

export declare function workshopDev(options?: {
	cwd?: string
	target?: string
	story?: string
	port?: number
	device?: string
}): Promise<unknown>

/**
 * Shared dev-server seam for DOM targets — the caller owns process
 * lifecycle. Exported so qualification harnesses can boot the exact
 * production wiring.
 */
export declare function startWorkshopServer(options?: {
	root?: string
	config?: object
	target?: string
	story?: string
	port?: number
}): Promise<{ server: unknown; url: string }>

/** Linux host prerequisites as a missing-item list (empty when satisfied). */
export declare function linuxMissingPrerequisites(): string[]

export declare function findConfigFile(root: string): string | null
export declare function loadWorkshopConfig(
	root: string,
): Promise<{ config: object; file: string | null }>
