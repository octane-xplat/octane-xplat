// Emit the macOS source contract without exposing implementation .ts files to
// NodeNext consumers. Relative declaration imports use explicit .js specifiers.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const program = ts.createProgram([resolve(root, 'src/index.macos.ts')], {
	strict: true,
	skipLibCheck: true,
	module: ts.ModuleKind.ESNext,
	moduleResolution: ts.ModuleResolutionKind.Bundler,
	target: ts.ScriptTarget.ESNext,
	declaration: true,
	emitDeclarationOnly: true,
	rootDir: resolve(root, 'src'),
	outDir: resolve(root, 'types/generated/macos'),
})

const diagnostics = ts.getPreEmitDiagnostics(program)
if (diagnostics.length) {
	console.error(
		ts.formatDiagnosticsWithColorAndContext(diagnostics, {
			getCanonicalFileName: (file) => file,
			getCurrentDirectory: () => root,
			getNewLine: () => '\n',
		}),
	)

	process.exit(1)
}

const emitted = program.emit(undefined, (file, text) => {
	mkdirSync(dirname(file), { recursive: true })
	writeFileSync(
		file,
		text.replace(
			/(from\s+['"])(\.[^'"]+)(['"])/g,
			(_match, before, specifier, after) =>
				`${before}${specifier.endsWith('.js') ? specifier : `${specifier}.js`}${after}`,
		),
	)
})

if (emitted.emitSkipped) {
	throw new Error('macOS platform declaration emission failed')
}

console.log('platform: emitted macOS declarations')
