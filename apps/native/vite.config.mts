import { defineConfig, mergeConfig } from 'vite';
import { octaneConfig } from '@nativescript-community/vite-octane';
import { nativeScriptRenderer } from '@nativescript-community/octane/config';

export default defineConfig(({ mode }) =>
  mergeConfig(
    octaneConfig(
      { mode },
      {
        octane: {
          renderers: {
            registry: { nativescript: nativeScriptRenderer },
            // First match wins. Owned files = every component file in the
            // native graph (shared .tsrx + .native leaves); .web files never
            // resolve on this target. Plain .ts under a rule is *validated*
            // (forbiddenGlobals/imports) not compiled.
            rules: [
              { include: 'src/**/*.{ts,tsx,tsrx}', renderer: 'nativescript' },
              { include: '**/packages/**/*.{ts,tsx,tsrx}', renderer: 'nativescript' },
            ],
          },
        },
      },
    ),
    {
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
