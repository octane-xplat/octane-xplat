import { defineConfig } from 'vite';
import { octane } from '@octanejs/vite-plugin';

// The web build. For native (iOS/Android), the same source runs through
// @nativescript-community/vite-octane with `conditions: ['native']` and the
// .ios/.android/.native suffix chain — see the octane-xplat repo's
// apps/native/vite.config.mts.
export default defineConfig({
	plugins: [...octane()],
	server: { port: 5200 },
	resolve: {
		conditions: ['web'],
		// Suffix chain (first match wins): .web → shared → fallback.
		extensions: [
			'.web.tsrx', '.tsrx',
			'.web.tsx', '.tsx',
			'.web.ts', '.mjs', '.mts', '.ts',
			'.jsx', '.js', '.json',
		],
	},
});
