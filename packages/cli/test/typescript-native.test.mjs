import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { after, test } from 'node:test'
import { build } from 'vite'
import ts from 'typescript-classic'
import { xplatBoundary } from '../dist/vite.js'

const require = createRequire(import.meta.url)
const dir = mkdtempSync(join(tmpdir(), 'xplat-native-ts-'))
after(() => rmSync(dir, { recursive: true, force: true }))
symlinkSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../node_modules'),
  join(dir, 'node_modules'),
  process.platform === 'win32' ? 'junction' : 'dir',
)

writeFileSync(join(dir, 'package.json'), '{"type":"module","private":true}')
writeFileSync(
  join(dir, 'Contract.tsrx'),
  '// Type contract only.\nexport declare function Contract(props: { label: string }): string\n',
)

const platforms = ['web', 'ios', 'android', 'macos', 'gtk', 'windows']
for (const platform of platforms) {
  writeFileSync(
    join(dir, `Contract.${platform}.tsrx`),
    `export function Contract(props: { label: string }): string { return 'runtime-${platform}-' + props.label }\n`,
  )
}

writeFileSync(
  join(dir, 'tsconfig.json'),
  JSON.stringify({
    contentMappers: [{ package: '@tsrx/content-mapper', extensions: ['.tsrx'] }],
    compilerOptions: {
      module: 'ESNext',
      moduleResolution: 'Bundler',
      target: 'ESNext',
      strict: true,
      noEmit: true,
      allowImportingTsExtensions: true,
      types: [],
      skipLibCheck: true,
      jsx: 'preserve',
    },
    include: ['*.ts', '*.tsrx'],
  }),
)

function check() {
  return spawnSync(
    process.execPath,
    [
      join(dirname(require.resolve('typescript/package.json')), 'bin/tsc'),
      '--runExternalCode',
      '--noEmit',
      '-p',
      join(dir, 'tsconfig.json'),
    ],
    { cwd: dir, encoding: 'utf8', timeout: 30_000 },
  )
}

test('native TypeScript checks explicit TSRX contracts and every implementation', () => {
  writeFileSync(
    join(dir, 'consumer.ts'),
    "import { Contract } from './Contract.tsrx'\nContract({ label: 'ok' })\n// @ts-expect-error imported props must not become any\nContract({ label: 42 })\n",
  )
  const valid = check()
  assert.equal(valid.status, 0, valid.stdout + valid.stderr)
  writeFileSync(
    join(dir, 'consumer.ts'),
    "import { Contract } from './Contract.tsrx'\nContract({ label: 42 })\n",
  )
  const invalid = check()
  assert.notEqual(invalid.status, 0)
  assert.match(invalid.stdout + invalid.stderr, /TS2322/)
})

for (const platform of platforms) {
  test(`${platform} production bundling selects an implementation over the contract stub`, async () => {
    writeFileSync(join(dir, 'entry.ts'), "export { Contract } from './Contract.tsrx'\n")
    const result = await build({
      configFile: false,
      root: dir,
      logLevel: 'silent',
      plugins: [
        xplatBoundary(platform),
        {
          name: 'plain-typescript-fixture',
          transform(source, id) {
            if (id.endsWith('.tsrx')) {
              return ts.transpileModule(source, {
                fileName: id + '.ts',
                compilerOptions: { module: ts.ModuleKind.ESNext },
              }).outputText
            }
          },
        },
      ],
      build: {
        write: false,
        minify: false,
        lib: { entry: join(dir, 'entry.ts'), formats: ['es'] },
      },
    })
    const code = (Array.isArray(result) ? result : [result])
      .flatMap((r) => r.output)
      .filter((o) => o.type === 'chunk')
      .map((o) => o.code)
      .join('\n')
    assert.ok(code.includes(`runtime-${platform}-`), code)
  })
}
