import type { UserConfig } from 'vite'
import type { WorkshopConfig } from '../../types/generated/contract.js'
/** Preserves the consumer config and prepends the native workshop's pre HMR hook. */
export declare function withWorkshopMobile(
	config: UserConfig,
	options?: {
		cwd?: string
		target?: 'ios' | 'android'
		story?: string
		config?: WorkshopConfig
	},
): UserConfig

/** @internal Virtual module identity; exposed for adapter contract checks. */
export declare const MOBILE_CATALOG_ID: string
/** @internal Generate a statically filtered native catalog without module evaluation. */
export declare function mobileCatalogCode(
	root: string,
	config: WorkshopConfig,
	target: 'ios' | 'android',
): string
