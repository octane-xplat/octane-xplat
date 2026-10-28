import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const uiRequire = createRequire(new URL('../packages/ui/package.json', import.meta.url))

// Isolate the pure normalizers without loading AppKit, GTK, or NativeScript.
function normalizer(path, name) {
	const source = readFileSync(path, 'utf8')
	const ast = ts.createSourceFile(String(path), source, ts.ScriptTarget.Latest, true)
	const declaration = ast.statements.find(
		(node) => ts.isFunctionDeclaration(node) && node.name?.text === name,
	)
	assert.ok(declaration, `${name} must exist in ${path}`)
	const { outputText } = ts.transpileModule(declaration.getText(ast), {
		compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS },
	})
	return new Function(`${outputText}\nreturn ${name}`)()
}

const normalizers = {
	Octane: normalizer(
		new URL('../packages/ui/node_modules/octane/dist/class-names.js', import.meta.url),
		'normalizeClass',
	),
	NativeScript: normalizer(
		uiRequire.resolve('@nativescript-community/octane').replace(/index\.js$/, 'driver.js'),
		'normalizeClass',
	),
	macOS: normalizer(
		new URL('../packages/macos-renderer/src/index.ts', import.meta.url),
		'normalizeClass',
	),
	GTK: normalizer(
		new URL('../packages/linux-gtk-renderer/src/index.ts', import.meta.url),
		'classList',
	),
}

const conditionalClass = (count) => count && 'active'
const cases = [
	[0, ''],
	[NaN, ''],
	[42, '42'],
	[-2, '-2'],
	[Infinity, 'Infinity'],
	[conditionalClass(0), ''],
	[conditionalClass(2), 'active'],
	[['card', [0, NaN, 42, null, false, undefined], { selected: 1, hidden: 0 }], 'card 42 selected'],
]

for (const [renderer, normalize] of Object.entries(normalizers)) {
	test(`${renderer} follows Octane numeric class composition`, () => {
		for (const [input, expected] of cases) {
			const result = normalize(input)
			assert.equal(Array.isArray(result) ? result.join(' ') : result, expected)
		}
	})
}
