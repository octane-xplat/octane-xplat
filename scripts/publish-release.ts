#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { publishablePackages, lockstepPackages } from './publishable.ts'
import { stageRelease } from '../tools/cli-go/stage-release.mjs'

const cliPackage = '@octane-xplat/cli'
const payloadPackage = (name: string) => name.startsWith('@octane-xplat/cli-native-')

/** Pack every pending package before publishing any; reruns skip existing versions. */
export function publishRelease({
  root = resolve(import.meta.dirname, '..'),
  tag = 'latest',
  packageName,
  nativeDir,
  dryRun = false,
  run = spawnSync,
  stager = stageRelease,
}: {
  root?: string
  tag?: string
  packageName?: string
  nativeDir?: string
  dryRun?: boolean
  run?: typeof spawnSync
  stager?: typeof stageRelease
} = {}) {
  if (!/^[a-z][a-z0-9._-]*$/.test(tag)) {
    throw new Error(`Invalid release tag: ${tag}`)
  }
  const selected: { name: string; version: string; dir: string }[] = packageName
    ? publishablePackages(root)
    : lockstepPackages(root)
  const packages = packageName ? selected.filter((pkg) => pkg.name === packageName) : selected
  if (!packages.length) {
    throw new Error(`No publishable package matches ${packageName}`)
  }
  // The lockstep set includes the native CLI: staging it needs the five
  // cross-built payload binaries. Independent tracks (e.g. --package
  // tsrx-typegen) never carry native payloads.
  const cli = packages.find((pkg) => pkg.name === cliPackage)
  if (!packageName && cli && !nativeDir) {
    throw new Error('Publishing the lockstep set requires --native-dir <dir>')
  }
  const work = mkdtempSync(join(tmpdir(), 'xplat-release-'))
  const execute = (command: string, args: string[], cwd = root) => {
    const result = run(command, args, {
      cwd,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    })
    if (result.error) {
      throw result.error
    }
    return result
  }
  const published = (identity: string) => {
    const existing = execute('npm', ['view', identity, 'version', '--json'])
    if (existing.status === 0) {
      if (JSON.parse(String(existing.stdout)) !== identity.split('@').pop()) {
        throw new Error(`Unexpected registry response for ${identity}`)
      }

      console.log(`Already published: ${identity}`)
      return true
    }

    let code: string | undefined
    try {
      code = JSON.parse(String(existing.stdout)).error?.code
    } catch {
      /* Check npm's structured stderr too. */
    }

    if (!code) {
      try {
        code = JSON.parse(String(existing.stderr)).error?.code
      } catch {
        /* Report below. */
      }
    }

    if (code !== 'E404') {
      throw new Error(`Registry lookup failed for ${identity}: ${existing.stderr}`)
    }
    return false
  }
  try {
    const pending: { name: string; version: string; tarball: string }[] = []
    for (const pkg of packages) {
      const identity = `${pkg.name}@${pkg.version}`
      if (published(identity)) {
        continue
      }

      let tarball: string
      if (pkg.name === cliPackage && nativeDir) {
        // The staged tarball carries the native payload inventory; the five
        // payload tarballs publish alongside it at the same version.
        const staged = stager({ root, version: pkg.version, nativeDir, outputDir: work })
        tarball = staged.cli.archive
        for (const payload of staged.payloads) {
          const name = payload.manifest.name
          if (!published(`${name}@${pkg.version}`)) {
            pending.push({ name, version: pkg.version, tarball: payload.archive })
          }
        }
      } else {
        const before = new Set(readdirSync(work))
        const packed = execute('bun', ['pm', 'pack', '--destination', work], join(root, pkg.dir))
        if (packed.status !== 0) {
          throw new Error(`Bun pack failed for ${identity}: ${packed.stderr}`)
        }

        const files = readdirSync(work).filter(
          (name) => name.endsWith('.tgz') && !before.has(name),
        )
        if (files.length !== 1) {
          throw new Error(`Expected one tarball for ${identity}, found ${files.length}`)
        }
        tarball = join(work, files[0])
      }

      pending.push({ ...pkg, tarball })
    }

    // Payloads publish before the CLI that installs them; the CLI precedes
    // dependents like the octane-xplat umbrella.
    const order = (name: string) =>
      payloadPackage(name) ? 0 : name === cliPackage ? 1 : 2
    pending.sort((a, b) => order(a.name) - order(b.name))

    for (const pkg of pending) {
      const args = [
        'publish',
        pkg.tarball,
        '--access',
        'public',
        '--provenance',
        '--tag',
        tag,
        ...(dryRun ? ['--dry-run'] : []),
      ]

      const result = execute('npm', args)
      if (result.status !== 0) {
        throw new Error(`npm publish failed for ${pkg.name}@${pkg.version}: ${result.stderr}`)
      }

      console.log(String(result.stdout).trim())
    }

    return pending.map(({ name, version }) => `${name}@${version}`)
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  let tag = 'latest'
  let packageName: string | undefined
  let nativeDir: string | undefined
  let dryRun = false
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--dry-run') {
      dryRun = true
    } else if (args[index] === '--tag' && args[index + 1]) {
      tag = args[++index]
    } else if (args[index] === '--package' && args[index + 1]) {
      packageName = args[++index]
    } else if (args[index] === '--native-dir' && args[index + 1]) {
      nativeDir = args[++index]
    } else {
      throw new Error(`Unknown or incomplete argument: ${args[index]}`)
    }
  }

  publishRelease({ tag, packageName, nativeDir, dryRun })
}
