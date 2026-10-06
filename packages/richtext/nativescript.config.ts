import type { NativeScriptConfig } from '@nativescript/core'

// Plugin-level NativeScript config — read by the CLI's plugin discovery for
// every app that depends on @octane-xplat/richtext directly. Declares the
// iOS Swift facade's engine dependency so consuming apps don't wire it
// themselves.
export default {
	ios: {
		SPMPackages: [
			{
				name: 'AztecEditor-iOS',
				libs: ['Aztec'],
				repositoryURL:
					'https://github.com/wordpress-mobile/AztecEditor-iOS',
				// '#' prefix selects a revision requirement in the generated
				// pbxproj — develop @ 44aeac6 (podspec version 1.20.0, first
				// with SPM support). MPL-2.0; see platforms/ios/UPSTREAM.md.
				version: '#44aeac606a3cff6d6ecb1d49ea3f9068082567e1',
			},
		],
	},
} as NativeScriptConfig
