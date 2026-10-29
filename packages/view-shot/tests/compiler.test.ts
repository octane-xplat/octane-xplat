import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { compile } from 'octane/compiler'

describe('component compiler boundaries without capturing images', () => {
	for (const [file, target, module] of [
		['ViewShot.tsx', 'native', '@nativescript-community/octane'],
		['ViewShot.macos.tsx', 'macos', '@octane-xplat/macos-renderer'],
		['ViewShot.gtk.tsx', 'gtk', '@octane-xplat/linux-gtk'],
		['use-view-shot.tsx', 'native', '@nativescript-community/octane'],
	] as const) {
		for (const hmr of [false, true]) {
			it(`${file} compiles for ${target} with HMR ${hmr}`, () => {
				const source = readFileSync(new URL('../src/' + file, import.meta.url), 'utf8')
				expect(() =>
					compile(source, file, {
						hmr,
						renderer: {
							id: target,
							module,
							target: 'universal',
							server: 'unsupported',
							text: 'host',
						},
					}),
				).not.toThrow()
			})
		}
	}
})
