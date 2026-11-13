import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import ts from 'typescript-classic'

it('maintained readiness examples typecheck against the public package declarations', () => {
  const examples = [
    'examples/readiness/loading.tsrx',
    'examples/readiness/recovery.tsrx',
    'examples/dev-actions/readiness.tsrx',
  ]

  const sources = new Map(
    examples.map((path, index) => [
      resolve(dirname(fileURLToPath(import.meta.url)), `_readiness-example-${index}.tsx`),
      readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../../../', path), 'utf8'),
    ]),
  )

  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    jsxImportSource: '@octane-xplat/jsx',
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    allowImportingTsExtensions: true,
    types: ['vite/client'],
  }

  const host = ts.createCompilerHost(options)
  const read = host.readFile.bind(host)
  const exists = host.fileExists.bind(host)
  const getSource = host.getSourceFile.bind(host)

  host.readFile = (path) => sources.get(path) ?? read(path)
  host.fileExists = (path) => sources.has(path) || exists(path)
  host.getSourceFile = (path, language, onError, createNew) => {
    const source = sources.get(path)

    return source === undefined
      ? getSource(path, language, onError, createNew)
      : ts.createSourceFile(path, source, language, true)
  }

  const program = ts.createProgram({ rootNames: [...sources.keys()], options, host })
  const diagnostics = ts.getPreEmitDiagnostics(program)

  expect(
    ts.formatDiagnostics(diagnostics, {
      getCanonicalFileName: (name) => name,
      getCurrentDirectory: host.getCurrentDirectory,
      getNewLine: () => '\n',
    }),
  ).toBe('')
}, 20000)
