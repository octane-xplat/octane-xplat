import { defineConfig } from 'vite'
import { xplatNative } from '@octane-xplat/cli/vite'

export default defineConfig(({ mode }) =>
	xplatNative(mode, {
		rules: [
			{
				include: '**/apps/mobile/src/**/*.{ts,tsx,tsrx}',
				exclude: '**/*.web.*',
				renderer: 'nativescript',
			},
			{ include: 'src/**/*.{ts,tsx,tsrx}', exclude: '**/*.web.*', renderer: 'nativescript' },
			{
				include: '**/packages/**/*.{ts,tsx,tsrx}',
				exclude: '**/*.web.*',
				renderer: 'nativescript',
			},
		],
	}),
)
