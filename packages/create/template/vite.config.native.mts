import { defineConfig, mergeConfig } from 'vite';
import { octaneConfig } from '@nativescript-community/vite-octane';
import { nativeScriptRenderer } from '@nativescript-community/octane/config';

// The native build (iOS/Android). @octane-xplat/ui resolves through the
// package's `native` export condition → compiled dist/native — no .tsrx
// leaves needed from node_modules, so the renderer rule covers src/ only.
export default defineConfig(({ mode }) =>
	mergeConfig(
		octaneConfig(
			{ mode },
			{
				octane: {
					renderers: {
						registry: { nativescript: nativeScriptRenderer },
						rules: [
							{ include: 'src/**/*.{ts,tsx,tsrx}', renderer: 'nativescript' },
						],
					},
				},
			},
		),
		{
			resolve: {
				conditions: ['native'],
				// The deps-bundle scanner sees source-level 'octane' imports
				// before the compiler retargets hooks — without this it vendors
				// the DOM runtime. Exact match only.
				alias: [{ find: /^octane$/, replacement: 'octane/universal/native' }],
				preserveSymlinks: false,
				// Suffix chain (first match wins): .ios/.android → .native → shared.
				extensions: [
					'.ios.tsrx', '.android.tsrx', '.native.tsrx', '.tsrx',
					'.ios.tsx', '.android.tsx', '.native.tsx', '.tsx',
					'.ios.ts', '.android.ts', '.native.ts', '.mjs', '.mts', '.ts',
					'.jsx', '.js', '.json',
				],
			},
		},
	),
);
