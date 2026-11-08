import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import assert from 'node:assert/strict'
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import ts from 'typescript-classic'
import { test } from 'node:test'
import { generateMarkdownForModule } from 'exports-md'

test('API task prepares declarations and builds for every published package', () => {
  const { tasks } = JSON.parse(readFileSync(new URL('./turbo.json', import.meta.url), 'utf8'))
  for (const entry of readdirSync('../../packages', { withFileTypes: true })) {
    if (!entry.isDirectory() || !existsSync(`../../packages/${entry.name}/package.json`)) {
      continue
    }

    const manifest = JSON.parse(readFileSync(`../../packages/${entry.name}/package.json`, 'utf8'))
    if (manifest.private) {
      continue
    }

    for (const task of ['typegen', 'build']) {
      if (manifest.scripts?.[task]) {
        assert.ok(
          tasks.api.dependsOn.includes(`${manifest.name}#${task}`),
          `${manifest.name}#${task}`,
        )
      }
    }
  }
})

test('exports-md preserves TSDoc across declaration re-exports and subpaths', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'xplat-api-test-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'types'))
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      name: 'documented-widget',
      exports: {
        '.': { types: './types/index.d.ts' },
        './options': { types: './types/options.d.ts' },
      },
    }),
  )
  writeFileSync(join(root, 'types/index.d.ts'), "export { Options } from './options.js'\n")
  writeFileSync(
    join(root, 'types/options.d.ts'),
    '/** Configure the widget. */\nexport interface Options {\n/** Visible label. */\nlabel: string\n}\n',
  )
  const result = await generateMarkdownForModule(join(root, 'package.json'), {
    cwd: dirname(ts.sys.getExecutingFilePath()),
    followImports: false,
    followReExports: true,
    propertyDocs: 'list',
  })
  assert.match(result.markdown, /# documented-widget\/options/)
  assert.match(result.markdown, /Configure the widget/)
  assert.match(result.markdown, /Visible label/)
})

test('source-only tooling exports retain inferred signatures and list JavaScript-only commands', async (t) => {
  const { packageMarkdown } = await import('./scripts/api-package.mjs')
  const root = mkdtempSync(join(tmpdir(), 'xplat-api-source-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'src'))
  mkdirSync(join(root, 'bin'))
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      name: 'source-widget',
      exports: {
        '.': { default: './dist/index.js' },
        './bin': './bin/run.mjs',
      },
    }),
  )
  writeFileSync(
    join(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        strict: true,
      },
    }),
  )
  writeFileSync(
    join(root, 'src/index.ts'),
    '/** Format a visible greeting. */\nexport function greet(name: string) { return `Hello ${name}` }\n',
  )
  writeFileSync(join(root, 'bin/run.mjs'), 'console.log("Run the command")\n')
  const markdown = await packageMarkdown(join(root, 'package.json'))
  assert.match(markdown, /Format a visible greeting/)
  assert.match(markdown, /greet\(name: string\): string/)
  assert.match(markdown, /JavaScript-only entry points[^\n]+source-widget\/bin/)
})

test('missing explicit declarations fail instead of dropping the entry point', async (t) => {
  const { packageMarkdown } = await import('./scripts/api-package.mjs')
  const root = mkdtempSync(join(tmpdir(), 'xplat-api-missing-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      name: 'missing-widget',
      exports: { '.': { types: './missing.d.ts' } },
    }),
  )
  await assert.rejects(packageMarkdown(join(root, 'package.json')), /Module not found/)
})

test('all names in a variable declaration list remain reachable through re-exports', async (t) => {
  const { packageMarkdown } = await import('./scripts/api-package.mjs')
  const root = mkdtempSync(join(tmpdir(), 'xplat-api-variables-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      name: 'variable-widget',
      exports: { '.': { types: './index.d.ts' } },
    }),
  )
  writeFileSync(join(root, 'index.d.ts'), "export { first, second } from './values.js'\n")
  writeFileSync(
    join(root, 'values.d.ts'),
    '/** Widget handles. */\nexport declare const first: string, second: number;\n',
  )
  const markdown = await packageMarkdown(join(root, 'package.json'))
  assert.match(markdown, /first/)
  assert.match(markdown, /second/)
  assert.match(markdown, /Widget handles/)
  assert.match(markdown, /export declare const second: number/)
})

test('the publishing worker flushes API pages larger than a pipe buffer', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'xplat-api-large-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      name: 'large-widget',
      exports: { '.': { types: './index.d.ts' } },
    }),
  )
  const fields = Array.from(
    { length: 2400 },
    (_, index) => `/** Visible field ${index}. */\nfield${index}: string;`,
  ).join('\n')
  writeFileSync(
    join(root, 'index.d.ts'),
    `/** A large public interface. */\nexport interface Large {\n${fields}\n}\nexport declare const finalMarker: string;\n`,
  )
  const result = await promisify(execFile)(
    process.execPath,
    [new URL('./scripts/build-api.mjs', import.meta.url).pathname, join(root, 'package.json')],
    { maxBuffer: 2 * 1024 * 1024 },
  )
  assert.ok(result.stdout.length > 64 * 1024)
  assert.match(result.stdout, /field2399/)
  assert.match(result.stdout, /export declare const finalMarker: string/)
  assert.ok(result.stdout.trimEnd().endsWith('```'))
})

test('a default function re-export produces a valid anonymous default signature', async (t) => {
  const { packageMarkdown } = await import('./scripts/api-package.mjs')
  const root = mkdtempSync(join(tmpdir(), 'xplat-api-default-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({ name: 'default-widget', exports: { '.': { types: './index.d.ts' } } }),
  )
  writeFileSync(join(root, 'index.d.ts'), "export { View as default } from './view.js';\n")
  writeFileSync(
    join(root, 'view.d.ts'),
    '/** Render a view. */\nexport declare function View(props: { label: string }): unknown;\n',
  )
  const markdown = await packageMarkdown(join(root, 'package.json'))
  assert.match(markdown, /export default function \(/)
  assert.doesNotMatch(markdown, /function default\(/)
})

test('declaration formatting preserves usage examples for independent validation', async (t) => {
  const { packageMarkdown } = await import('./scripts/api-package.mjs')
  const root = mkdtempSync(join(tmpdir(), 'xplat-api-examples-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({ name: 'example-widget', exports: { '.': { types: './index.d.ts' } } }),
  )
  writeFileSync(
    join(root, 'index.d.ts'),
    '/** A widget.\n * @example\n * ```ts\n * const missing: string;\n * ```\n */\nexport declare const widget: string;\n',
  )
  const markdown = await packageMarkdown(join(root, 'package.json'))
  assert.match(markdown, /export declare const widget: string/)
  assert.match(markdown, /```ts\nconst missing: string;\n```/)
})

test('JavaScript-only packages list every worker without importing executable code', async (t) => {
  const { packageMarkdown } = await import('./scripts/api-package.mjs')
  const root = mkdtempSync(join(tmpdir(), 'xplat-api-workers-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      name: 'worker-package',
      exports: {
        './worker': './run.mjs',
        './diagnostics': { node: './run.cjs', default: './run.js' },
        './package.json': './package.json',
      },
    }),
  )
  for (const file of ['run.mjs', 'run.cjs', 'run.js']) {
    writeFileSync(join(root, file), 'throw new Error("Do not execute a worker to document it")\n')
  }
  const markdown = await packageMarkdown(join(root, 'package.json'))
  assert.match(markdown, /JavaScript-only entry points without TypeScript declarations/)
  assert.match(markdown, /`worker-package\/worker`/)
  assert.match(markdown, /`worker-package\/diagnostics`/)
  assert.match(markdown, /See the package guide for usage/)
  assert.doesNotMatch(markdown, /worker-package\/package\.json/)
  const manifest = JSON.parse(readFileSync(join(root, 'package.json')))
  manifest.exports['./missing-worker'] = './missing.mjs'
  writeFileSync(join(root, 'package.json'), JSON.stringify(manifest))
  await assert.rejects(packageMarkdown(join(root, 'package.json')))
})
