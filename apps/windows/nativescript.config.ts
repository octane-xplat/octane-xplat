import { NativeScriptConfig } from '@nativescript/core'

export default {
	id:
		process.env.XPLAT_WINDOWS_QUALIFICATION === '1'
			? 'org.octanexplat.windows61'
			: 'org.nativescript.xplat',
	appPath: 'src',
	appResourcesPath: 'App_Resources',
	// Keep NativeScript's installs on the same package manager as the app.
	cli: {
		packageManager: 'bun',
	},
	bundler: 'vite',
	bundlerConfigPath: 'vite.config.mts',
} as NativeScriptConfig
