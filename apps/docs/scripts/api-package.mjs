import {
	cpSync,
	existsSync,
	globSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import ts from 'typescript-classic'
import { generateMarkdownForModule } from 'exports-md'

/** Keep reference signatures valid TypeScript outside a .d.ts file. */
function declarationFences(markdown) {
	return markdown.replace(
		/^[ \t]*```(ts|typescript)[ \t]*\n([\s\S]*?)^[ \t]*```[ \t]*$/gm,
		(_match, language, code, offset) => {
			// Usage examples must still fail syntax checks if their source is invalid.
			if (markdown.lastIndexOf('**Examples**', offset) > markdown.lastIndexOf('\n##', offset)) {
				return _match
			}
			// Re-exporting a function as default gives it a reserved name in exports-md.
			code = code.replace(/^export default function default(?=[<(])/gm, 'export default function ')
			const ast = ts.createSourceFile('signature.ts', code, ts.ScriptTarget.Latest, true)
			const edits = []
			for (const node of ast.statements) {
				if (
					!ts.isVariableStatement(node) ||
					node.declarationList.declarations.some((declaration) => declaration.initializer)
				) {
					continue
				}
				if (node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword)) {
					continue
				}
				const exported = node.modifiers?.find(
					(modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
				)
				edits.push({
					at: exported ? exported.end : node.getStart(ast),
					text: exported ? ' declare' : 'declare ',
				})
			}
			for (const edit of edits.reverse()) {
				code = code.slice(0, edit.at) + edit.text + code.slice(edit.at)
			}
			return `\`\`\`${language}\n${code}\`\`\``
		},
	)
}

/** Render the package's declared entry points without scanning other workspaces. */
export async function packageMarkdown(manifestPath) {
	const source = dirname(resolve(manifestPath))
	const staging = mkdtempSync(join(tmpdir(), 'xplat-api-'))
	const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
	const sources = new Set()
	const untyped = new Set()
	const wildcards = []
	const sdkAliases = []
	try {
		cpSync(source, staging, {
			recursive: true,
			filter: (path) => {
				if (['node_modules', '.git', '.turbo', 'platforms'].includes(basename(path))) {
					return false
				}
				return !/\.[^/]+$/.test(basename(path)) || /\.(?:[cm]?tsx?|tsrx|json)$/.test(path)
			},
		})
		// Declarations need only a local resolver config. Keep node_modules out of
		// the copy; the original dependency links still resolve external types.
		writeFileSync(
			join(staging, 'tsconfig.json'),
			JSON.stringify({
				compilerOptions: {
					target: 'ES2022',
					module: 'ESNext',
					moduleResolution: 'Bundler',
					allowImportingTsExtensions: true,
					strict: true,
				},
			}),
		)
		if (existsSync(join(source, 'node_modules'))) {
			symlinkSync(join(source, 'node_modules'), join(staging, 'node_modules'), 'junction')
		}
		function target(value, entry) {
			if (typeof value === 'string') {
				if (/\.[cm]?js$/.test(value)) {
					const declaration = value.replace(/\.([cm]?)js$/, '.d.$1ts')
					if (globSync(declaration, { cwd: source }).length) {
						return value
					}
					const candidate = value.replace(/^\.\/dist\//, './src/').replace(/\.[cm]?js$/, '.ts')
					if (globSync(candidate, { cwd: source }).length) {
						return target(candidate, entry)
					}
					// A JavaScript-only command has no TSDoc declaration to render.
					// Explicit types targets never take this path: missing declarations fail.
					if (globSync(value, { cwd: source }).length) {
						untyped.add(entry)
						return undefined
					}
				}
				if (/\.(?:[cm]?ts|tsx)$/.test(value) && !/\.d\.[cm]?ts$/.test(value)) {
					for (const file of globSync(value, { cwd: source })) {
						sources.add(resolve(source, file))
					}
					return value.replace(/\.(?:([cm]?)ts|tsx)$/, '.d.$1ts')
				}
				return value
			}
			if (Array.isArray(value)) {
				return value.map((v) => target(v, entry)).filter(Boolean)
			}
			if (value && typeof value === 'object') {
				if ('types' in value) {
					return { types: target(value.types, entry) }
				}
				return Object.fromEntries(
					Object.entries(value)
						.map(([key, v]) => [key, target(v, entry)])
						.filter(([, v]) => v !== undefined),
				)
			}
			return value
		}
		if (manifest.exports) {
			manifest.exports = Object.fromEntries(
				Object.entries(manifest.exports)
					.filter(([entry]) => {
						if (
							manifest.name === '@octane-xplat/platform' &&
							['./ios', './android', './macos', './windows'].includes(entry)
						) {
							sdkAliases.push(entry)
							return false
						}
						if (!entry.includes('*')) {
							return true
						}
						wildcards.push(entry)
						return false
					})
					.map(([entry, value]) => [entry, target(value, entry)])
					.filter(
						([, value]) =>
							value !== undefined && (typeof value !== 'object' || Object.keys(value).length),
					),
			)
		}
		for (const key of ['types', 'typings']) {
			if (manifest[key]) {
				manifest[key] = target(manifest[key], '.')
			}
		}
		if (sources.size) {
			// Emit once per package, using its own compiler settings, rather than
			// asking exports-md to launch one compiler per wildcard entry point.
			const configPath =
				ts.findConfigFile(source, ts.sys.fileExists) ?? resolve(source, '../../tsconfig.base.json')
			const config = ts.readConfigFile(configPath, ts.sys.readFile)
			if (config.error) {
				throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'))
			}
			const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(configPath))
			const program = ts.createProgram([...sources], {
				...options,
				declaration: true,
				emitDeclarationOnly: true,
				noEmit: false,
				noEmitOnError: false,
				declarationMap: false,
				removeComments: false,
				isolatedDeclarations: false,
				rootDir: undefined,
				outDir: join(staging, '.emit'),
			})
			const emitted = program.emit(undefined, (file, contents, _bom, _error, sourceFiles) => {
				const original = sourceFiles?.[0]?.fileName
				if (!original) {
					return
				}
				const rel = relative(source, original)
				if (rel.startsWith('..')) {
					return
				}
				const destination = join(staging, rel.replace(/\.(?:([cm]?)ts|tsx)$/, '.d.$1ts'))
				mkdirSync(dirname(destination), { recursive: true })
				writeFileSync(destination, contents)
				// Let relative re-exports resolve to declarations instead of recompiling source.
				const copiedSource = join(staging, rel)
				if (copiedSource !== destination) {
					rmSync(copiedSource, { force: true })
				}
			})
			if (emitted.emitSkipped) {
				throw new Error(
					`Could not emit API declarations for ${manifest.name}: ${ts.formatDiagnosticsWithColorAndContext(emitted.diagnostics, { getCanonicalFileName: (file) => file, getCurrentDirectory: () => source, getNewLine: () => '\n' })}`,
				)
			}
		}
		// exports-md 0.2.20 indexes only the first variable in a declaration list.
		// Split lists in the disposable declarations so every export is reachable.
		for (const file of globSync('**/*.d.{ts,mts,cts}', {
			cwd: staging,
			exclude: ['node_modules/**'],
		})) {
			const path = join(staging, file)
			const ast = ts.createSourceFile(
				path,
				readFileSync(path, 'utf8'),
				ts.ScriptTarget.Latest,
				true,
			)
			if (
				!ast.statements.some(
					(node) => ts.isVariableStatement(node) && node.declarationList.declarations.length > 1,
				)
			) {
				continue
			}
			const statements = ast.statements.flatMap((node) => {
				if (!ts.isVariableStatement(node)) {
					return [node]
				}
				return node.declarationList.declarations.map((declaration) =>
					ts.factory.updateVariableStatement(
						node,
						node.modifiers,
						ts.factory.updateVariableDeclarationList(node.declarationList, [declaration]),
					),
				)
			})
			writeFileSync(
				path,
				ts.createPrinter().printFile(ts.factory.updateSourceFile(ast, statements)),
			)
		}
		writeFileSync(join(staging, 'package.json'), JSON.stringify(manifest))
		const result = await generateMarkdownForModule(join(staging, 'package.json'), {
			// exports-md parses declarations through TypeScript's classic JavaScript API.
			cwd: dirname(ts.sys.getExecutingFilePath()),
			followImports: false,
			followReExports: true,
			propertyDocs: 'list',
		})
		const note = untyped.size
			? `\nJavaScript-only entry points without TypeScript declarations: ${[...untyped].map((entry) => `\`${manifest.name}${entry === '.' ? '' : entry.slice(1)}\``).join(', ')}. See the package guide for usage.\n`
			: ''
		const scope = wildcards.length
			? `\nThis reference covers the root and explicitly named subpaths. Wildcard subpaths (${wildcards.map((entry) => `\`${entry}\``).join(', ')}) follow the declarations in the installed package.\n`
			: ''
		const sdk = sdkAliases.length
			? '\nGenerated OS SDK aliases (`/ios`, `/android`, `/macos`, `/windows`) are not expanded here. See the [native API type guidance](https://docs.nativescript.org/guide/native-code/generate-typings) and the declarations in your installed package.\n'
			: ''
		return scope + sdk + declarationFences(result.markdown) + note
	} finally {
		rmSync(staging, { recursive: true, force: true })
	}
}
