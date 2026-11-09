import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const repository = resolve(import.meta.dirname, '../..')
const workspaceKey = createHash('sha256').update(repository).digest('hex').slice(0, 8)
const scratch = join(homedir(), 'agent-scratch/octane-xplat', `tailwind-consumer-${workspaceKey}`)

mkdirSync(scratch, { recursive: true })
writeFileSync(
  join(scratch, 'README.md'),
  `Everything in this folder is disposable.\n\nOwner: tools/tailwind-qualification.\nSource: ${repository}\nRun through @octane-xplat/tailwind's test:packed Turbo task. Retained evidence belongs in ~/dev/reports/octane-xplat.\n`,
)

const runRoot = mkdtempSync(join(scratch, 'run-'))
const packs = join(runRoot, 'packs')
const consumer = join(runRoot, 'consumer')
const environment = { ...process.env }

delete environment.NODE_PATH
delete environment.NODE_OPTIONS
mkdirSync(packs)
mkdirSync(consumer)

function run(command, args, cwd = consumer) {
  const result = spawnSync(command, args, {
    cwd,
    env: environment,
    encoding: 'utf8',
    timeout: 180000,
    maxBuffer: 8 * 1024 * 1024,
  })

  assert.equal(
    result.status,
    0,
    `${command} failed (${result.status ?? result.signal}):\n${result.stdout}\n${result.stderr}`,
  )
  return result.stdout
}

function pack(directory) {
  const root = join(repository, 'packages', directory)
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

  // Turbo owns building declarations/dist; pack must not run raw build hooks.
  run('bun', ['pm', 'pack', '--ignore-scripts', '--destination', packs], root)

  const archive = join(
    packs,
    `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`,
  )

  assert.ok(existsSync(archive), `Missing archive: ${archive}`)
  return archive
}

let passed = false

try {
  const tailwind = pack('tailwind')
  const build = pack('build')
  const lib = pack('lib')
  const inventory = run('tar', ['-tzf', tailwind]).trim().split('\n')
  const manifest = JSON.parse(
    readFileSync(join(repository, 'packages/tailwind/package.json'), 'utf8'),
  )

  function checkExport(value) {
    if (typeof value === 'string') {
      assert.ok(
        inventory.includes(`package/${value.replace(/^\.\//, '')}`),
        `Missing export: ${value}`,
      )
    } else {
      for (const condition of Object.values(value)) {
        checkExport(condition)
      }
    }
  }

  for (const value of Object.values(manifest.exports)) {
    checkExport(value)
  }
  for (const file of [
    'LICENSE',
    'THIRD_PARTY_NOTICES',
    'dist/compile.js',
    'dist/ast.js',
    'src/ui-theme.css',
  ]) {
    assert.ok(inventory.includes(`package/${file}`), `Missing packed file: ${file}`)
  }
  assert.ok(
    inventory.every(
      (file) =>
        !/\/(node_modules|test)\//.test(file) && (!file.endsWith('.ts') || file.endsWith('.d.ts')),
    ),
    'Tarball must exclude tests, dependency trees and executable TypeScript',
  )

  const workspace = JSON.parse(readFileSync(join(repository, 'package.json'), 'utf8'))

  writeFileSync(
    join(consumer, 'package.json'),
    JSON.stringify({
      name: 'packed-tailwind-consumer',
      private: true,
      type: 'module',
      devDependencies: {
        '@octane-xplat/tailwind': `file:${tailwind}`,
        '@octane-xplat/build': `file:${build}`,
        '@octane-xplat/lib': `file:${lib}`,
        vite: workspace.workspaces.catalog.vite,
        typescript: workspace.workspaces.catalog['typescript-classic'].replace(
          'npm:typescript@',
          '',
        ),
        '@types/node': '26.6.6',
      },
      overrides: { '@octane-xplat/lib': `file:${lib}` },
    }),
  )
  run('bun', ['install', '--ignore-scripts', '--linker', 'isolated'])

  writeFileSync(
    join(consumer, 'types.ts'),
    `import type { Plugin } from 'vite'
import { xplatTailwind } from '@octane-xplat/tailwind/vite'
const plugin: Plugin = xplatTailwind()
void plugin
`,
  )
  writeFileSync(
    join(consumer, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        types: ['node'],
      },
      include: ['types.ts'],
    }),
  )
  const tsc = join(consumer, 'node_modules/typescript/bin/tsc')

  run(process.execPath, [tsc, '-p', 'tsconfig.json'])
  run(process.execPath, [
    tsc,
    '-p',
    'tsconfig.json',
    '--module',
    'ESNext',
    '--moduleResolution',
    'Bundler',
  ])
  copyFileSync(
    join(import.meta.dirname, 'fixtures/packed-consumer.mjs'),
    join(consumer, 'verify.mjs'),
  )
  const verification = run(process.execPath, ['verify.mjs'])

  console.log(verification.trim())
  console.log(
    'Packed Tailwind consumer passed with isolated dependencies and NodeNext/Bundler declarations.',
  )
  passed = true
} finally {
  if (passed) {
    rmSync(runRoot, { recursive: true, force: true })
  } else {
    console.error(`Disposable failing consumer retained at ${runRoot}`)
  }
}
