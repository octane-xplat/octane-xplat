import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { compile } from 'octane/compiler'

// These hooks return plugin data containing render callbacks. A successful
// DOM build does not prove that the universal compiler can lower those values.
for (const name of ['row-index', 'row-expansion', 'grouped-rows', 'row-status', 'tree-data']) {
	for (const hmr of [false, true]) {
		test(`${name} compiles for AppKit with HMR ${hmr ? 'on' : 'off'}`, async () => {
			const filename = `use-table-${name}.tsrx`
			const source = await readFile(new URL(`../src/table/${filename}`, import.meta.url), 'utf8')
			compile(source, filename, {
				hmr,
				renderer: {
					id: 'macos',
					module: '@octane-xplat/macos-renderer',
					target: 'universal',
					server: 'unsupported',
					text: 'host',
				},
			})
		})
	}
}
