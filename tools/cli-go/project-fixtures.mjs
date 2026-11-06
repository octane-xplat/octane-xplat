// Isolated selected-project toolchains for native project-command gates.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { canPrepareFixtures, prepareFixtures } from './fixtures.mjs'

export function projectToolFixture(
  root,
  work,
  scratch,
  {
    checker = false,
    vite = true,
    formatter = false,
    linter = false,
    packageManagement = false,
    creator = false,
    fontConverter = false,
    workshopCompiler = false,
  } = {},
) {
  // Source-host test tasks may run concurrently. Never replace a shared archive
  // while another task is reading its recorded bytes/hash. Portable snapshots
  // instead consume their already-frozen read-only fixture archives.
  let fixtureWork = work
  if (canPrepareFixtures(root)) {
    fixtureWork = join(scratch, 'worker-packages')
    mkdirSync(fixtureWork)
    prepareFixtures(root, fixtureWork, { linter, packageManagement, creator })
  }
  const flavor = creator
    ? 'scaffold-packages'
    : packageManagement
      ? 'management-packages'
      : 'project-packages'
  const packages = JSON.parse(readFileSync(join(fixtureWork, flavor + '.json')))
  const deps = Object.fromEntries(
    packages.packages
      .filter((item) => !item.optional || linter)
      .map((item) => {
        const file = join(fixtureWork, flavor, item.file),
          bytes = readFileSync(file)
        assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256)
        assert.equal(bytes.length, item.bytes)
        return [item.name, `file:${file.replaceAll('\\', '/')}`]
      }),
  )
  const installed = join(scratch, 'installed')
  mkdirSync(installed)
  writeFileSync(
    join(installed, 'package.json'),
    JSON.stringify({
      name: 'go-project-worker-consumer',
      private: true,
      type: 'module',
      devDependencies: {
        ...deps,
        ...(workshopCompiler
          ? {
              ...packages.workshopCompiler,
              storybook: packages.workshopStorybook,
              tinyglobby: packages.workshopGlob,
            }
          : {}),
        ...(fontConverter ? { wawoff2: packages.fontConverter } : {}),
        ...(formatter ? { '@octane-xplat/fmt': packages.formatter } : {}),
        ...(vite ? { vite: packages.vite } : {}),
        ...(checker ? { typescript: packages.checker } : {}),
      },
      overrides: { '@octane-xplat/lib': deps['@octane-xplat/lib'] },
    }),
  )
  const result = spawnSync('bun', ['install', '--ignore-scripts', '--linker', 'isolated'], {
    cwd: installed,
    encoding: 'utf8',
    timeout: 120000,
  })
  assert.equal(result.status, 0, result.stderr)
  return {
    archiveDirectory: join(fixtureWork, flavor),
    nodeModules: join(installed, 'node_modules'),
    worker: realpathSync(join(installed, 'node_modules/@octane-xplat/cli/dist/build-worker.js')),
    packages,
  }
}
