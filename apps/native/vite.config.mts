import { defineConfig, mergeConfig } from 'vite';
import { octaneConfig } from '@nativescript-community/vite-octane';
import { nativeScriptRenderer } from '@nativescript-community/octane/config';

export default defineConfig(({ mode }) =>
  mergeConfig(
    octaneConfig({
      mode,
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
    }),
    {
      resolve: {
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
