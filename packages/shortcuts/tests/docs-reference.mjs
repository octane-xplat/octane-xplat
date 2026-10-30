import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = fileURLToPath(new URL('..', import.meta.url))
const page = fileURLToPath(new URL('../../../docs/app/keyboard-shortcuts-api.md', import.meta.url))
const markdown = readFileSync(page, 'utf8')
const examples = [...markdown.matchAll(/^```ts\n([\s\S]*?)^```/gm)]
assert.ok(examples.length > 0, 'API reference must contain TypeScript examples')

// Export coverage catches a newly added public name that has no reference entry.
// It does not replace reviewing field semantics, defaults, or lifecycle claims.
const publicSource = ts.createSourceFile(
	'public.ts',
	readFileSync(join(root, 'src/engine/types/public.ts'), 'utf8'),
	ts.ScriptTarget.Latest,
	true,
)
const exported = (node) =>
	node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
const names = publicSource.statements
	.filter(
		(node) =>
			(ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) && exported(node),
	)
	.map((node) => node.name.text)
for (const file of ['src/shared.ts', 'src/index.web.ts']) {
	const source = ts.createSourceFile(
		file,
		readFileSync(join(root, file), 'utf8'),
		ts.ScriptTarget.Latest,
		true,
	)
	for (const node of source.statements) {
		if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
			names.push(...node.exportClause.elements.map((element) => element.name.text))
		} else if (ts.isFunctionDeclaration(node) && exported(node) && node.name) {
			names.push(node.name.text)
		}
	}
}
const prose = markdown.replace(/^```[^\n]*\n[\s\S]*?^```/gm, '')
for (const name of names) {
	assert.match(prose, new RegExp(`\\b${name}\\b`), `Missing API reference for ${name}`)
}

const cache = join(root, 'node_modules/.cache')
mkdirSync(cache, { recursive: true })
const temporary = mkdtempSync(join(cache, 'shortcuts-docs-'))
try {
	const scope = join(temporary, 'node_modules/@octane-xplat')
	mkdirSync(scope, { recursive: true })
	symlinkSync(root, join(scope, 'shortcuts'), 'dir')
	writeFileSync(
		join(temporary, 'context.ts'),
		`
import type { ShortcutRuntime } from '@octane-xplat/shortcuts'
export declare const shortcuts: ShortcutRuntime
export declare const editor: HTMLDivElement
`,
	)
	const files = examples.map((match, index) => {
		const code = match[1]
		const source = ts.createSourceFile(`example-${index}.ts`, code, ts.ScriptTarget.Latest, true)
		const declared = new Set()
		for (const node of source.statements) {
			if (ts.isVariableStatement(node)) {
				for (const declaration of node.declarationList.declarations) {
					if (ts.isIdentifier(declaration.name)) {
						declared.add(declaration.name.text)
					}
				}
			}
		}
		const context = ['shortcuts', 'editor'].filter((name) => !declared.has(name))
		const prelude = context.length ? `import { ${context.join(', ')} } from './context.js'\n` : ''
		const file = join(temporary, `example-${index + 1}.ts`)
		const line = markdown.slice(0, match.index).split('\n').length
		writeFileSync(file, `// keyboard-shortcuts-api.md:${line}\n${prelude}${code}\nexport {}\n`)
		return file
	})
	const program = ts.createProgram(files, {
		noEmit: true,
		strict: true,
		target: ts.ScriptTarget.ES2022,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
		types: [],
		skipLibCheck: false,
	})
	const diagnostics = ts.getPreEmitDiagnostics(program)
	if (diagnostics.length) {
		throw new Error(
			ts.formatDiagnosticsWithColorAndContext(diagnostics, {
				getCanonicalFileName: (file) => file,
				getCurrentDirectory: () => root,
				getNewLine: () => '\n',
			}),
		)
	}
	console.log(
		`API reference: ${names.length} exports covered; ${examples.length} TypeScript examples typechecked.`,
	)
} finally {
	rmSync(temporary, { recursive: true, force: true })
}
