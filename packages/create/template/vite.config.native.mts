import { defineConfig, mergeConfig, type Plugin } from 'vite';
import { octaneConfig } from '@nativescript-community/vite-octane';
import { nativeScriptRenderer } from '@nativescript-community/octane/config';

/**
 * On-device HMR needs the app's websocket client to attach to /ns-hmr after
 * the HTTP boot. When it never does — the @valor/nativescript-websockets
 * polyfill missing from the bundle, `adb reverse` not covering the vite port,
 * or a boot error before the client import — every save logs `recipients=0`
 * and the device silently stays stale. Warn once when a dev session was
 * fetched but no client ever attached.
 */
function nsHmrClientWatchdog(): Plugin {
	return {
		name: 'ns-hmr-client-watchdog',
		configureServer(server) {
			let everConnected = false;
			let timer: ReturnType<typeof setTimeout> | undefined;
			// Hook the raw 'request' event — middlewares.use() appends after the
			// ns plugin's session handler, which ends the response without next(),
			// so a connect middleware never observes /__ns_dev__/session at all.
			server.httpServer?.on('request', (req) => {
				if (!everConnected && req.url?.startsWith('/__ns_dev__/session')) {
					clearTimeout(timer);
					timer = setTimeout(() => {
						if (!everConnected) {
							console.warn(
								'[ns-hmr-client-watchdog] the app fetched its dev session ' +
									'but no /ns-hmr websocket client connected — edits will not ' +
									'reach the device. Check that @valor/nativescript-websockets ' +
									'is installed, `adb reverse tcp:<port>` covers this vite port ' +
									'(physical Android), and the device log for hmr-client errors.',
							);
						}
					}, 15_000);
				}
			});

			server.httpServer?.on('upgrade', (req) => {
				if (req.url?.startsWith('/ns-hmr')) {
					everConnected = true;
					clearTimeout(timer);
				}
			});
		},
	};
}

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
			plugins: [nsHmrClientWatchdog()],
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
