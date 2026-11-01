// Ambient typing floor for `icons:*` virtual modules resolved by the
// `xplatIcons` Vite plugin (@octane-xplat/icons/vite). Every
// `icons:<prefix>/<name>` specifier default-imports an IconifyIcon value.
// This file is a global script (no top-level exports) so the wildcard
// declaration activates once the file is in the app's program: reference it
// from an app ambient file —
//   /// <reference path="../node_modules/@octane-xplat/icons/icons.d.ts" />
// — add it to tsconfig "include", or copy the declaration into an app d.ts.
// TODO(octane-xplat#93): TS 6.1+ content mappers replace this stub with
// plugin-supplied declaration content.
declare module 'icons:*' {
	import type { IconifyIcon } from '@octane-xplat/icons'
	const icon: IconifyIcon
	export default icon
}
