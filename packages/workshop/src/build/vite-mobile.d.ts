import type { UserConfig } from 'vite'
import type { WorkshopConfig } from '../../types/generated/contract.js'
/** Preserves the consumer config and prepends the native workshop's pre HMR hook. */
export declare function withWorkshopMobile(
	config: UserConfig,
	options?: {
		/** Consumer package root; defaults to process.cwd(). */
		cwd?: string
		/** Mobile render target. */
		target?: 'ios' | 'android'
		/** Story id to open on load. */
		story?: string
		/** Inline workshop config — overrides the discovered workshop.config file. */
		config?: WorkshopConfig
	},
): UserConfig

/** Virtual module identity; exposed for adapter contract checks. @internal */
export declare const MOBILE_CATALOG_ID: string
/** Generate a statically filtered native catalog without module evaluation. @internal */
export declare function mobileCatalogCode(
	root: string,
	config: WorkshopConfig,
	target: 'ios' | 'android',
): string
