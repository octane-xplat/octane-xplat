// Verify the packed create-octane-xplat starter patch bytes and registrations.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compatibility, managedPackage } from '../packages/create/compatibility.ts'
import { composeManifest, composeTargets, defaultTargets } from '../packages/create/scaffold.ts'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const canonical = join(repo, 'packages/cli/patches')
const manifest = JSON.parse(readFileSync(join(canonical, 'manifest.json'), 'utf8')).patches

// The starter patch set — the same filter sync-patches.ts applies.
const templatePatches = manifest.filter((patch) => {
  const at = patch.specifier.indexOf('@', 1)
  const pin = managedPackage(patch.specifier.slice(0, at))

  return patch.template !== false && (!pin || pin.version === patch.specifier.slice(at + 1))
})
const wanted = templatePatches.map((patch) => patch.file).sort()

const work = mkdtempSync(join(tmpdir(), 'xplat-packed-patches-'))
function run(command, args, cwd = work) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.error) {
    throw result.error
  }

  assert.equal(result.status, 0, `${command} ${args.join(' ')} failed`)
}

function checkConfig(label, pkg, base) {
  assert.equal(pkg.packageManager, `bun@${compatibility.tools.bun}`, `${label}: manager`)
  for (const [specifier, path] of Object.entries(pkg.patchedDependencies)) {
    const patch = manifest.find((entry) => entry.specifier === specifier)

    assert.ok(patch, `${label}: unknown patch ${specifier}`)
    assert.equal(path, `patches/${patch.file}`)
    assert.deepEqual(
      readFileSync(join(base, path)),
      readFileSync(join(canonical, patch.file)),
      `${label}: ${specifier} bytes`,
    )
  }
}

try {
  run('bun', ['pm', 'pack', '--destination', work], join(repo, 'packages/create'))

  const tarball = readdirSync(work).find((name) => name.endsWith('.tgz'))

  assert.ok(tarball)
  run('tar', ['-xzf', join(work, tarball), '-C', work])

  const packed = join(work, 'package')
  const pkg = JSON.parse(readFileSync(join(packed, 'package.json'), 'utf8'))

  assert.equal(pkg.name, 'create-octane-xplat')
  assert.equal(pkg.version, compatibility.frameworkVersion)

  for (const template of ['template', 'library-template']) {
    const base = join(packed, template)

    assert.deepEqual(
      readdirSync(join(base, 'patches')).sort(),
      wanted,
      `${template}: packed patch set`,
    )
    checkConfig(
      template,
      JSON.parse(readFileSync(join(base, 'package.json'), 'utf8')),
      base,
    )
  }

  const consumer = join(work, 'consumer')

  composeTargets(defaultTargets, consumer)

  const app = composeManifest(defaultTargets)

  checkConfig('generated default native config', app, consumer)
  console.log(
    `Packed ${pkg.name}: ${wanted.length} starter patches; bytes and registrations verified.`,
  )

  if (process.argv.includes('--install')) {
    // Qualify the whole native upstream patch set without unpublished framework packages.
    const dependencies = Object.fromEntries(
      Object.entries({ ...app.dependencies, ...app.devDependencies }).filter(
        ([name]) => !compatibility.frameworkPackages.includes(name),
      ),
    )

    for (const specifier of Object.keys(app.patchedDependencies)) {
      const at = specifier.indexOf('@', 1)

      dependencies[specifier.slice(0, at)] = specifier.slice(at + 1)
    }

    writeFileSync(
      join(consumer, 'package.json'),
      JSON.stringify({ ...app, dependencies, devDependencies: {}, scripts: {} }),
    )

    run('bun', ['install', '--ignore-scripts'], consumer)

    const lock = readFileSync(join(consumer, 'bun.lock'), 'utf8')

    for (const specifier of Object.keys(app.patchedDependencies)) {
      assert.ok(lock.includes(JSON.stringify(specifier)), `${specifier}: no locked patch`)
    }

    run('bun', ['install', '--frozen-lockfile', '--ignore-scripts'], consumer)
    assert.equal(readFileSync(join(consumer, 'bun.lock'), 'utf8'), lock)
    console.log('Native upstream Bun installation passed; scripts disabled, no device build.')
  }
} finally {
  rmSync(work, { recursive: true, force: true })
}
