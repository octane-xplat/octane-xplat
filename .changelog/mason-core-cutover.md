---
release: lockstep
---

### Mason core is the only mobile layout engine

iOS and Android apps now always build with `@octane-xplat/nativescript-mason-core`,
which provides Mason layout containers, scrolling, styling, and safe-area `env()`
resolution without MasonKit's HTML elements or widgets. The engine is selected
by platform, not by dependency choice, and `xplatNative` resolves the renderer's
existing imports to the installed core package.

**Breaking change:** `@octane-xplat/nativescript-masonkit` and
`@triniwiz/nativescript-masonkit` are no longer supported on mobile. Run
`pnpm dlx @octane-xplat/cli@latest upgrade` to replace their pins with the core
catalog entry; doctor and the bundler reject replaced pins until upgraded.
Windows preview apps keep full MasonKit — core ships no Windows artifacts yet.

```json
{
	"dependencies": {
		"@octane-xplat/nativescript-mason-core": "catalog:xplat"
	}
}
```
