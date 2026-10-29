import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { compile } from 'octane/compiler'
for (const hmr of [false, true]) {
	it('compiles the permission hook for universal renderers, HMR ' + hmr, () => {
		const source = readFileSync(
			new URL('../src/use-tracking-permissions.tsx', import.meta.url),
			'utf8',
		)
		expect(() =>
			compile(source, 'use-tracking-permissions.tsx', {
				hmr,
				renderer: {
					id: 'native',
					module: '@nativescript-community/octane',
					target: 'universal',
					server: 'unsupported',
					text: 'host',
				},
			}),
		).not.toThrow()
	})
}
