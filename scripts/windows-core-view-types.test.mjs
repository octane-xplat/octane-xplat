import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const appRequire = createRequire(path.join(root, 'apps/windows/package.json'))
const core = path.dirname(appRequire.resolve('@nativescript/core'))
const viewDeclaration = path.join(core, 'ui/core/view/index.windows.d.ts')

test('Windows layout subclasses remain assignable to View without loosening named properties', () => {
	const directory = mkdtempSync(path.join(root, 'node_modules/.windows-core-types-'))
	try {
		const fixture = path.join(directory, 'fixture.ts')
		writeFileSync(
			fixture,
			`
import { FlexboxLayout, Label, StackLayout, View } from '@nativescript/core';
const stack = new StackLayout();
const box = new FlexboxLayout();
box.flexDirection = 'row';
stack.addChild(box);
const view: View = box;
const stackView: View = stack;
box.addChild(new Label());
// @ts-expect-error Named properties retain their actual types.
view.opacity = 'wrong';
const key: symbol = Symbol();
// @ts-expect-error Dynamic native symbols require narrowing before invocation.
view[key]();
`,
		)
		const check = (repair) => {
			const options = {
				noEmit: true,
				strict: true,
				skipLibCheck: true,
				module: ts.ModuleKind.ESNext,
				target: ts.ScriptTarget.ES2022,
				moduleResolution: ts.ModuleResolutionKind.Bundler,
				moduleSuffixes: ['.windows', ''],
				types: [],
				baseUrl: root,
				paths: { '@nativescript/core': [core] },
			}
			const host = ts.createCompilerHost(options)
			const read = host.readFile
			host.readFile = (file) => {
				const source = read(file)
				if (path.resolve(file) !== viewDeclaration) {
					return source
				}
				assert.ok(
					source.includes('[key: symbol]: unknown;'),
					'Installed Windows Core declaration repair is missing',
				)
				return repair ? source : source.replace('    [key: symbol]: unknown;\n', '')
			}
			const program = ts.createProgram([fixture], options, host)
			return ts.getPreEmitDiagnostics(program).map((d) => ({
				code: d.code,
				file: d.file?.fileName,
				message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
			}))
		}
		const baseline = check(false)
		assert.ok(
			baseline.some((d) => d.code === 2345 || d.code === 2322),
			JSON.stringify(baseline),
		)
		assert.deepEqual(check(true), [])
	} finally {
		rmSync(directory, { recursive: true, force: true })
	}
})
