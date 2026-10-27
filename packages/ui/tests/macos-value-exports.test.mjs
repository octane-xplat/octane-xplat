import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { buildMacOSBarrel } from './macos-barrel.mjs'

test('macOS explicitly exports every declared runtime value', () => {
	const declaration = fileURLToPath(new URL('../types/generated/index.macos.d.ts', import.meta.url))
	const program = ts.createProgram([declaration], {
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		module: ts.ModuleKind.ESNext,
		target: ts.ScriptTarget.ESNext,
	})
	const checker = program.getTypeChecker()
	const module = checker.getSymbolAtLocation(program.getSourceFile(declaration))
	const declared = checker
		.getExportsOfModule(module)
		.filter((symbol) => {
			const resolved =
				symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
			return resolved.flags & ts.SymbolFlags.Value
		})
		.map((symbol) => symbol.name)
		.sort()
	const source = ts.createSourceFile(
		'index.macos.ts',
		readFileSync(new URL('../src/index.macos.ts', import.meta.url), 'utf8'),
		ts.ScriptTarget.Latest,
		true,
	)
	const values = new Set()
	for (const statement of source.statements) {
		if (
			ts.isExportDeclaration(statement) &&
			!statement.isTypeOnly &&
			statement.exportClause &&
			ts.isNamedExports(statement.exportClause)
		) {
			for (const entry of statement.exportClause.elements) {
				if (!entry.isTypeOnly) {
					values.add(entry.name.text)
				}
			}
		}

		if (statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
			if (ts.isVariableStatement(statement)) {
				for (const entry of statement.declarationList.declarations) {
					values.add(entry.name.getText(source))
				}
			} else if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) {
				if (statement.name) {
					values.add(statement.name.text)
				}
			}
		}
	}
	assert.deepEqual([...values].sort(), declared)
})

test('AppKit named themes register scoped CSS once without NativeScript', () => {
	const source = readFileSync(
		new URL('../src/theme/theme-css-inject.macos.ts', import.meta.url),
		'utf8',
	)
		.replace(/^import .*$/gm, '')
		.replace(/^export /gm, '')
	const registrations = []
	const theme = { name: 'travel' }
	const api = runInNewContext(
		ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ESNext } }).outputText +
			'\n({ ensureThemeCss, syncDocumentRootTheme })',
		{
			registerStylesheet: (...args) => registrations.push(args),
			generateThemeCss: (value, options) => {
				assert.equal(value, theme)
				assert.equal(options.target, 'native')
				return '.xds-theme-travel { --color-primary: blue; }'
			},
		},
	)
	api.ensureThemeCss(theme)
	api.ensureThemeCss(theme)
	assert.deepEqual(registrations, [
		['xplat-theme:travel', '.xds-theme-travel { --color-primary: blue; }'],
	])
	api.syncDocumentRootTheme('travel', 'dark')()
})

test('the AppKit Theme leaf bundles with the macOS platform guard', async () => {
	const values = await buildMacOSBarrel(
		undefined,
		fileURLToPath(new URL('../src/theme/Theme.macos.tsrx', import.meta.url)),
	)
	assert.deepEqual(values, ['Theme'])
})
