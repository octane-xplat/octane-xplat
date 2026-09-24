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

export default defineConfig(({ mode }) =>
  mergeConfig(
    octaneConfig(
      { mode },
      {
        octane: {
          renderers: {
            // The stock renderer ships validation.forbiddenGlobals/Imports
            // by default since 0.2.1 (upstream #6), so a plain registry
            // entry suffices.
            registry: { nativescript: nativeScriptRenderer },
            // First match wins. Owned files = every component file in the
            // native graph (shared .tsrx + .native leaves); .web files never
            // resolve on this target. Caveat (Exp 8): validation lives in
            // the compile pipeline — plain .ts helpers under a rule are NOT
            // checked; a DOM global there would slip through. Only .tsrx/
            // .tsx component files get forbiddenGlobals/imports enforced.
            rules: [
              { include: 'src/**/*.{ts,tsx,tsrx}', renderer: 'nativescript' },
              { include: '**/packages/**/*.{ts,tsx,tsrx}', renderer: 'nativescript' },
            ],
          },
        },
      },
    ),
    {
      plugins: [nsHmrClientWatchdog()],
      optimizeDeps: {
        // Flattened optimizeDeps chunks get mangled by the /ns/m device
        // transform (`import import "/ns/core/utils"`) and miss the vendor
        // manifest — serve the @nativescript plugins per-module instead.
        exclude: [
          '@nativescript/biometrics',
          '@nativescript/haptics',
          '@nativescript/imagepicker',
          '@nativescript/local-notifications',
          '@nativescript/secure-storage',
          '@nativescript/social-share',
          'nativescript-clipboard',
        ],
      },
      resolve: {
        conditions: ['native'],
        // The compiler retargets hook imports to @nativescript-community/
        // octane, but the deps-bundle scanner sees source-level 'octane'
        // first — without this it vendors octane/dist/index.js (the full
        // DOM runtime, hydration + server-rpc included). Exact-match only:
        // 'octane/universal/native' itself must not be rewritten.
        alias: [{ find: /^octane$/, replacement: 'octane/universal/native' }],
        // Suffix chain: .ios/.android → .native → shared. NativeScript's own
        // ns-vite sets preserveSymlinks:true; under pnpm's isolated layout that
        // resolves a dep's imports from the symlink path instead of its real
        // .pnpm dir, so declared transitive deps (emoji-regex, @csstools/*,
        // devalue) can't be found. Realpathing restores correct resolution;
        // the device transform already normalizes .pnpm-infixed ids.
        preserveSymlinks: false,
        // Suffix chain: .ios/.android → .native → shared. NativeScript's own
        // file-qualifier suffixes (.land, .minWH600…) still apply to assets.
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
