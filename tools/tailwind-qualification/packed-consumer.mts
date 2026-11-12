import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  constants,
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'

import { homedir } from 'node:os'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    output: { type: 'string' },
    'measure-cost': { type: 'boolean' },
    app: { type: 'boolean' },
  },
})

if (values['measure-cost'] && !values.output) {
  throw new Error('--measure-cost requires --output for retained measurements')
}

if (values['measure-cost'] && existsSync(resolve(values.output))) {
  throw new Error('Choose a new --output directory for cost measurements')
}

if (values.app && (!values.output || existsSync(resolve(values.output)))) {
  throw new Error('--app requires a new --output directory')
}

if (values.app && values['measure-cost']) {
  throw new Error('Run app qualification and cost measurement separately')
}

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

function run(command, args, cwd = consumer, timeout = 180000) {
  const result = spawnSync(command, args, {
    cwd,
    env: environment,
    encoding: 'utf8',
    timeout,
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
  const qualification = JSON.parse(readFileSync(join(import.meta.dirname, 'package.json'), 'utf8'))
  const archives = {
    '@octane-xplat/tailwind': `file:${tailwind}`,
    '@octane-xplat/build': `file:${build}`,
    '@octane-xplat/lib': `file:${lib}`,
  }

  if (values.app) {
    const workspaces = new Map()

    for (const directory of readdirSync(join(repository, 'packages'))) {
      const file = join(repository, 'packages', directory, 'package.json')

      if (existsSync(file)) {
        workspaces.set(JSON.parse(readFileSync(file, 'utf8')).name, directory)
      }
    }

    const queue = ['@octane-xplat/ui']

    while (queue.length > 0) {
      const name = queue.shift()

      if (archives[name]) {
        continue
      }

      const directory = workspaces.get(name)

      assert.ok(directory, `Missing workspace: ${name}`)
      archives[name] = `file:${pack(directory)}`

      const dependency = JSON.parse(
        readFileSync(join(repository, 'packages', directory, 'package.json'), 'utf8'),
      )

      for (const [child, range] of Object.entries({
        ...dependency.dependencies,
        ...dependency.peerDependencies,
      })) {
        if (range.startsWith('workspace:')) {
          queue.push(child)
        }
      }
    }

    copyFileSync(
      join(
        repository,
        'packages/cli/patches',
        `octane@${workspace.workspaces.catalog.octane}.patch`,
      ),
      join(consumer, 'octane.patch'),
    )
  }

  writeFileSync(
    join(consumer, 'package.json'),
    JSON.stringify({
      name: 'packed-tailwind-consumer',
      private: true,
      type: 'module',
      ...(values.app
        ? {
            dependencies: {
              '@octane-xplat/ui': archives['@octane-xplat/ui'],
              octane: workspace.workspaces.catalog.octane,
            },
            patchedDependencies: {
              [`octane@${workspace.workspaces.catalog.octane}`]: 'octane.patch',
            },
          }
        : {}),
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
        ...(values.app
          ? {
              '@octane-xplat/jsx': archives['@octane-xplat/jsx'],
              '@tsrx/oxc': JSON.parse(
                readFileSync(join(repository, 'packages/create/template/package.json'), 'utf8'),
              ).workspaces.catalogs.xplat['@tsrx/oxc'],
              playwright: qualification.devDependencies.playwright,
            }
          : {}),
        ...(values['measure-cost']
          ? {
              '@tailwindcss/postcss': qualification.devDependencies['@tailwindcss/postcss'],
              '@nativescript/tailwind': qualification.devDependencies['@nativescript/tailwind'],
              postcss: qualification.devDependencies.postcss,
            }
          : {}),
      },
      overrides: values.app ? archives : { '@octane-xplat/lib': `file:${lib}` },
    }),
  )

  run('bun', [
    'install',
    '--ignore-scripts',
    '--linker',
    'isolated',
    ...(values.app ? ['--prefer-offline'] : []),
  ])

  if (values.app) {
    const fromUI = createRequire(
      realpathSync(join(consumer, 'node_modules/@octane-xplat/ui/package.json')),
    )

    for (const name of Object.keys(archives)) {
      const direct = join(consumer, 'node_modules', name)
      const installed = realpathSync(existsSync(direct) ? direct : fromUI.resolve(name))

      assert.ok(installed.startsWith(consumer), `Expected an isolated installed tarball: ${name}`)
      assert.ok(!installed.startsWith(repository), `Workspace link leaked into app: ${name}`)
    }

    const fromApp = createRequire(join(consumer, 'package.json'))

    assert.equal(
      realpathSync(fromUI.resolve('octane')),
      realpathSync(fromApp.resolve('octane')),
      'UI and app must share one Octane runtime',
    )
  }

  writeFileSync(
    join(consumer, 'types.ts'),
    `import type { Plugin } from 'vite'
import { tailwind } from '@octane-xplat/tailwind/vite'
const plugin: Plugin = tailwind()
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
    join(import.meta.dirname, 'fixtures/packed-consumer.mts'),
    join(consumer, 'verify.mjs'),
  )

  const verification = run(process.execPath, ['verify.mjs'])

  if (values.app) {
    cpSync(join(import.meta.dirname, 'fixtures/app'), join(consumer, 'app'), { recursive: true })
    copyFileSync(
      join(import.meta.dirname, 'fixtures/verify-app.web.mts'),
      join(consumer, 'verify-app.web.ts'),
    )

    const output = resolve(values.output)

    mkdirSync(output, { recursive: true })
    cpSync(join(consumer, 'app'), join(output, 'app-source'), { recursive: true })

    const installed = Object.keys(archives).map((name) => {
      const direct = join(consumer, 'node_modules', name)
      const fromUI = createRequire(
        realpathSync(join(consumer, 'node_modules/@octane-xplat/ui/package.json')),
      )

      let resolved = existsSync(direct) ? realpathSync(direct) : dirname(fromUI.resolve(name))

      while (!existsSync(join(resolved, 'package.json'))) {
        const parent = dirname(resolved)

        assert.notEqual(parent, resolved, `Missing installed manifest: ${name}`)
        resolved = parent
      }

      resolved = join(resolved, 'package.json')

      const metadata = JSON.parse(readFileSync(resolved, 'utf8'))
      const archive = archives[name].slice('file:'.length)

      return {
        name,
        version: metadata.version,
        archiveSha256: createHash('sha256').update(readFileSync(archive)).digest('hex'),
      }
    })

    writeFileSync(
      join(output, 'app-packages.json'),
      JSON.stringify(
        {
          node: process.version,
          octane: JSON.parse(
            readFileSync(join(consumer, 'node_modules/octane/package.json'), 'utf8'),
          ).version,
          packages: installed,
        },
        null,
        2,
      ) + '\n',
      { flag: 'wx' },
    )

    console.log(
      run(
        process.execPath,
        ['../verify-app.web.mts', '--output', output],
        join(consumer, 'app'),
        240000,
      ).trim(),
    )
  }

  if (values['measure-cost']) {
    copyFileSync(
      join(import.meta.dirname, 'fixtures/cost-consumer.mts'),
      join(consumer, 'cost-consumer.ts'),
    )

    run(
      process.execPath,
      ['cost-consumer.ts', '--output', resolve(values.output)],
      consumer,
      540000,
    )

    console.log(`Cost measurements written to ${join(resolve(values.output), 'cost.json')}`)
  }

  if (values.output) {
    const output = resolve(values.output)

    mkdirSync(output, { recursive: true })
    for (const target of ['web', 'ios', 'linux']) {
      const file = `compiled-${target}.css`

      copyFileSync(join(consumer, file), join(output, file), constants.COPYFILE_EXCL)
    }

    writeFileSync(join(output, 'consumer.json'), verification, { flag: 'wx' })
  }

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
