// @ts-nocheck — .mjs→.ts port style, matching the rest of packages/cli/src.
//
// Desktop CSS delivery: mobile serializes emitted .css assets through
// @nativescript/vite (generateBundle → addTaggedAdditionalCSS); the desktop
// hosts evaluate a single file — the macOS JSC host one `main.cjs`, GJS one
// ESM `app.js` via `gjs -m` — so we instead prepend one
// `(globalThis.__xplatStylesheets ??= []).push(...)` line to the entry
// chunk — the renderer's module-init drain in its css/stylesheets module
// picks it up. A prepended statement before ESM `import` declarations is
// valid and still runs before the bundled module bodies. Bamboo's output
// finalizer runs generateBundle at order 'pre', so this default-order hook
// sees the finalized `virtual:bamboo.css` asset alongside every
// module-imported sheet, in emission order.

import { processNativeCss } from './vite.ts'

export function xplatInlineStylesheets() {
	const warned = new Set<string>()
	return {
		name: 'xplat-inline-stylesheets',
		// Per-file processing — identical to mobile: xplat-web-only strip,
		// @layer unwrap, px→dip, letter-spacing em strip, divergence warns.
		transform: {
			order: 'pre',
			handler(code, id) {
				// Bamboo validates its complete sheet before the output adapter
				// filters it — same skip as the mobile plugin.
				if (id.split('?')[0].endsWith('virtual:bamboo.css')) {
					return
				}
				if (!id.split('?')[0].endsWith('.css')) {
					return
				}
				return processNativeCss(code, id, (m) => this.warn(m), { warned })
			},
		},
		generateBundle: {
			order: 'post',
			handler(_opts, bundle) {
				const sheets = []
				for (const file of Object.values(bundle)) {
					if (file.type !== 'asset' || !file.fileName.endsWith('.css')) {
						continue
					}
					const src =
						typeof file.source === 'string' ? file.source : new TextDecoder().decode(file.source)
					// Emitted assets bypass transform (e.g. @import inlining,
					// Bamboo's finalized sheet) — process here too.
					sheets.push([file.fileName, processNativeCss(src, file.fileName, (m) => this.warn(m), { warned })])
					// Bamboo's survival check ran at 'pre'; nothing else consumes
					// the files — the host evaluates only the entry chunk.
					delete bundle[file.fileName]
				}
				if (!sheets.length) {
					return
				}

				const entry = Object.values(bundle).find((file) => file.type === 'chunk' && file.isEntry)
				if (!entry) {
					this.warn('xplat-inline-stylesheets: no entry chunk found for stylesheet injection')
					return
				}

				const pairs = sheets.map(([id, css]) => `[${JSON.stringify(id)},${JSON.stringify(css)}]`)
				entry.code = `(globalThis.__xplatStylesheets ??= []).push(${pairs.join(',')});\n` + entry.code
				if (entry.map?.mappings) {
					// Shift every source mapping down one generated line.
					entry.map.mappings = ';' + entry.map.mappings
				}
			}
		},
	}
}
