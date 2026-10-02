import type { UserConfig } from 'vite'

export interface XplatMacOSOptions {
	/** App directory used to resolve its toolchain and renderer. Defaults to cwd. */
	root?: string
	/** Bundle the renderer and Octane for the host. Defaults to true. */
	packaged?: boolean
	/** Enable Octane's universal component HMR. Defaults to false. */
	hmr?: boolean
	/** Override the application entry; defaults to src/main.mjs when packaged. */
	entry?: string
	outDir?: string
	/** Override renderer rules; defaults to all reachable TSX/TSRX source. */
	rules?: unknown[]
}

/** Configure the experimental AppKit renderer using the app's installed toolchain. */
export function xplatMacOS(
	env: { mode: string } | string,
	options?: XplatMacOSOptions,
): Promise<UserConfig>
