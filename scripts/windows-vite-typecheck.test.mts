import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const root = path.resolve(import.meta.dirname, '..')
const appRequire = createRequire(path.join(root, 'apps/windows/package.json'))
const viteRoot = path.dirname(appRequire.resolve('@nativescript/vite'))
const { typescriptCheckPlugin } = await import(
  pathToFileURL(path.join(viteRoot, 'helpers/typescript-check.js')).href
)

// Use the installed plugin and both real compilers. The Windows and native
// leaves deliberately disagree, so choosing the wrong suffix cannot pass.
for (const tsrx of [false, true]) {
  test(`native Vite selects Windows leaves and rejects type errors (${tsrx ? 'TSRX' : 'TypeScript'})`, async () => {
    const directory = mkdtempSync(path.join(root, 'node_modules/.windows-vite-check-'))
    const previousCwd = process.cwd()

    try {
      writeFileSync(path.join(directory, 'package.json'), '{"type":"module"}')
      writeFileSync(
        path.join(directory, 'tsconfig.json'),
        JSON.stringify({
          contentMappers: [{ package: '@tsrx/content-mapper', extensions: ['.tsrx'] }],
          compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'Bundler',
            jsx: 'preserve',
            strict: true,
            noEmitOnError: true,
            allowImportingTsExtensions: true,
            types: [],
          },
          files: ['main.ts'],
        }),
      )

      writeFileSync(
        path.join(directory, 'value.windows.ts'),
        "export const value = 'windows' as const\n",
      )

      writeFileSync(
        path.join(directory, 'value.native.ts'),
        "export const value = 'native' as const\n",
      )

      writeFileSync(
        path.join(directory, 'view.windows.tsrx'),
        "export const view = 'tsrx' as const\n",
      )

      const entry = (expected, extension = '.tsrx') => `
import { value } from './value'
${tsrx ? `import { view } from './view.windows${extension}'; const checkedView: 'tsrx' = view` : ''}
const checked: '${expected}' = value
`

      const main = path.join(directory, 'main.ts')

      process.chdir(directory)

      const options = { platform: 'windows', logDiagnostics: false }
      const plugin = typescriptCheckPlugin(options)

      if (tsrx) {
        // The preview only detects explicit .tsrx imports. Preserve the
        // failure until upstream can discover extensionless TSRX modules.
        writeFileSync(main, entry('windows', ''))
        await assert.rejects(() => plugin.buildStart(), /TypeScript found 1 error/)
      }

      writeFileSync(main, entry('windows'))
      await plugin.buildStart()
      writeFileSync(main, entry('wrong'))
      await assert.rejects(
        () => plugin.buildStart(),
        tsrx ? /tsc reported type errors/ : /TypeScript found 1 error/,
      )
    } finally {
      process.chdir(previousCwd)
      rmSync(directory, { recursive: true, force: true })
    }
  })
}
