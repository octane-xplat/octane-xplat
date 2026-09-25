import { NativeScriptConfig } from '@nativescript/core'

export default {
	id: 'org.nativescript.xplat',
	appPath: 'src',
	appResourcesPath: 'App_Resources',
	// The workspace is pnpm-managed — without this the CLI defaults to npm
	// and spawns bundlers with --preserve-symlinks, which breaks isolated
	// node_modules resolution (symlinked packages can't find their deps).
	cli: {
		packageManager: 'pnpm',
	},
	android: {
		v8Flags: '--expose_gc',
		markingMode: 'none',
	},
	bundler: 'vite',
	bundlerConfigPath: 'vite.config.mts',
} as NativeScriptConfig
