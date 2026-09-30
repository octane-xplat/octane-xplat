import type { NativeScriptConfig } from '@nativescript/core'
export default {
	id: 'org.nativescript.xplat.navigation',
	appPath: 'src',
	appResourcesPath: '../App_Resources',
	cli: { packageManager: 'pnpm' },
	bundler: 'vite',
	bundlerConfigPath: 'vite.config.mts',
} satisfies NativeScriptConfig
