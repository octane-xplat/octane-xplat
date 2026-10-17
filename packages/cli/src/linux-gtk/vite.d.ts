import type { UserConfig } from 'vite'

export interface XplatLinuxGtkOptions {
	/** App directory used to resolve its toolchain and renderer. Defaults to cwd. */
	root?: string
	/** Enable Octane's universal component HMR. Defaults to false. */
	hmr?: boolean
	/** Override the application entry; defaults to src/main.ts. */
	entry?: string
	outDir?: string
	/** Output file name (without extension); defaults to 'app'. */
	fileName?: string
	/** Sources the Octane compiler must not transform. */
	exclude?: string[]
	/** Override renderer rules; defaults to all reachable TSX/TSRX source. */
	rules?: unknown[]
}

/** Configure the experimental GTK4/GJS renderer using the app's installed toolchain. */
export function xplatLinuxGtk(
	env: { mode: string } | string,
	options?: XplatLinuxGtkOptions,
): Promise<UserConfig>
