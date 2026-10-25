### Native dev vendor bundle honors Vite resolve.alias

Native dev sessions (`xplat dev` on iOS/Android) could boot with stub
modules when a `resolve.alias` entry redirected a package that is not
installed — for example a renderer alias that maps full MasonKit imports to
Mason core. The vendored dependency bundle ignored the app's aliases and
bundled throw-on-evaluate stubs, so importing the package failed at startup.
The dev server now replays Vite `resolve.alias` inside its dependency and
vendor bundle passes: aliases for absent packages resolve to real files
while installed packages keep their default resolution. No app changes are
required beyond the aliases you already declare.

```ts
// vite.config.native.mts
export default {
	resolve: {
		alias: [{ find: '@octane-xplat/nativescript-masonkit', replacement: '/abs/path/to/mason-core/index.ios.js' }],
	},
}
```

See the [toolchain guide](https://octane-xplat.goddardai.org/toolchain).
