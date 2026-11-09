import type { Plugin } from 'vite'
import type { WorkshopConfig } from '../../types/generated/contract.js'

/** Options for the workshop Vite plugin set. */
export interface XplatWorkshopOptions {
	/** Consumer package root; defaults to process.cwd(). */
	cwd?: string
	/** Inline workshop config — overrides the discovered workshop.config file. */
	config?: WorkshopConfig
	/** Render target the catalog is filtered for. */
	target?: 'web' | 'ios' | 'android' | 'macos' | 'windows' | 'linux'
	/** Story id to open on load; null/undefined opens the catalog default. */
	story?: string | null
}

/** Vite plugins wiring the workshop catalog, HMR and story discovery into a consumer app. */
export function workshop(options?: XplatWorkshopOptions): Plugin[]

/** @deprecated Use {@link workshop}. */
export const xplatWorkshop: typeof workshop
