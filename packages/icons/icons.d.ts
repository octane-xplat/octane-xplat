// Ambient typing floor for `icons:*` virtual modules resolved by the
// `xplatIcons` Vite plugin (@octane-xplat/icons/vite) — the opt-in fallback
// for consumers that cannot run the `.icon` content mapper (classic
// TypeScript 5/6, or typecheck flows that never sync the .icons stub tree).
// Every `icons:<prefix>/<name>` specifier default-imports an IconifyIcon
// value; the wildcard does not check the name against a collection. Do not
// include this file in a program that configures the content mapper: the
// wildcard matches specifiers the stub tree would have flagged as missing,
// masking the per-name check.
// This file is a global script (no top-level exports) so the wildcard
// declaration activates once the file is in the app's program: reference it
// from an app ambient file —
//   /// <reference path="../node_modules/@octane-xplat/icons/icons.d.ts" />
// — add it to tsconfig "include", or copy the declaration into an app d.ts.
declare module 'icons:*' {
  import type { IconifyIcon } from '@octane-xplat/icons'

  const icon: IconifyIcon

  export default icon
}
