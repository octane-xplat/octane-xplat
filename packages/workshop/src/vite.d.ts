import type { Plugin } from 'vite'
import type { WorkshopConfig } from './contract'

export interface XplatWorkshopOptions {
	cwd?: string
	config?: WorkshopConfig
	target?: 'web' | 'ios' | 'android' | 'macos' | 'windows' | 'linux'
	story?: string | null
}

export function xplatWorkshop(options?: XplatWorkshopOptions): Plugin[]
