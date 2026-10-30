import { NativeScriptConfig } from '@nativescript/core'

export default {
	id: process.env.XPLAT_DOCS_DEMOS
		? 'org.octanexplat.docsdemos'
		: (process.env.XPLAT_VLIST_APP_ID ?? 'org.nativescript.xplat'),
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
	ios: {
		SPMPackages: [
			{
				name: 'Pulsar',
				libs: ['Pulsar'],
				repositoryURL: 'https://github.com/software-mansion-labs/pulsar-ios',
				version: '1.4.0',
			},
		],
		NativeSource: [
			{
				name: 'XplatPulsarBridge',
				path: '../../packages/haptics/platforms/ios/src/**/*.swift',
			},
		],
	},
	bundler: 'vite',
	bundlerConfigPath: 'vite.config.mts',
} as NativeScriptConfig
