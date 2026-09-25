import { NativeScriptConfig } from '@nativescript/core'

export default {
	id: 'org.nativescript.octanexplat',
	appPath: 'src',
	appResourcesPath: 'App_Resources',
	// The workspace is pnpm-managed — without this the CLI defaults to npm
	// and spawns the bundler with --preserve-symlinks, which breaks isolated
	// node_modules resolution (a package's transitive deps never realpath
	// into the .pnpm store → ERR_MODULE_NOT_FOUND).
	cli: {
		packageManager: 'pnpm',
	},
	android: {
		v8Flags: '--expose_gc',
		markingMode: 'none',
	},
	bundler: 'vite',
	bundlerConfigPath: 'vite.config.native.mts',
} as NativeScriptConfig
