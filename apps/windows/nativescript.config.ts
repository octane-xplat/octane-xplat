import { NativeScriptConfig } from '@nativescript/core'

export default {
	id:
		process.env.XPLAT_WINDOWS_QUALIFICATION === '1'
			? 'org.octanexplat.windows61'
			: 'org.nativescript.xplat',
	appPath: 'src',
	appResourcesPath: 'App_Resources',
	// The workspace is pnpm-managed — without this the CLI defaults to npm
	// and spawns bundlers with --preserve-symlinks, which breaks isolated
	// node_modules resolution (symlinked packages can't find their deps).
	cli: {
		packageManager: 'pnpm',
	},
	bundler: 'vite',
	bundlerConfigPath: 'vite.config.mts',
} as NativeScriptConfig
