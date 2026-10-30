import { NativeScriptConfig } from '@nativescript/core'

export default {
	id: 'org.nativescript.octanexplat',
	appPath: 'src',
	appResourcesPath: 'App_Resources',
	// Keep NativeScript's installs on the same package manager as the app.
	cli: {
		packageManager: 'bun',
	},
	android: {
		v8Flags: '--expose_gc',
		markingMode: 'none',
	},
	bundler: 'vite',
	bundlerConfigPath: 'vite.config.native.mts',
} as NativeScriptConfig
