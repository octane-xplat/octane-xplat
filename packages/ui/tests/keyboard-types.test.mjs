import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

for (const [target, moduleSuffixes] of [
	['web', ['.web', '']],
	['native', ['.ios', '.android', '.mobile', '']],
	[
		'combined',
		['', '.web', '.ios', '.android', '.mobile', '.native', '.macos', '.linux', '.windows'],
	],
]) {
	test(`useKeyboard public types resolve with ${target} module suffixes`, () => {
		const program = ts.createProgram({
			rootNames: ['use-keyboard.ts', 'use-keyboard.web.ts'].map((file) =>
				fileURLToPath(new URL(`../src/${file}`, import.meta.url)),
			),
			options: {
				strict: true,
				noEmit: true,
				skipLibCheck: true,
				target: ts.ScriptTarget.ES2022,
				module: ts.ModuleKind.ESNext,
				moduleResolution: ts.ModuleResolutionKind.Bundler,
				types: [],
				moduleSuffixes,
			},
		})
		const errors = ts
			.getPreEmitDiagnostics(program)
			.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
			.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
		assert.deepEqual(errors, [])
	})
}
