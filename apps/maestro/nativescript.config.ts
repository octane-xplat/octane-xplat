import type { NativeScriptConfig } from '@nativescript/core'

export default {
	id: 'org.nativescript.xplat.maestro',
	appPath: 'src',
	appResourcesPath: '../mobile/App_Resources',
	cli: { packageManager: 'pnpm' },
	bundler: 'vite',
	bundlerConfigPath: 'vite.config.mts',
} satisfies NativeScriptConfig
