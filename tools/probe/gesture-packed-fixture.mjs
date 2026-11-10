import { createHash } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'

/** Copy the actual tarballs into an isolated consumer; no UI/Motion source alias. */
export function packedGestureFixture(repo, fixture) {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-gesture-consumer-')))
  const run = (command, args, cwd) => {
    const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })

    if (result.error) {
      throw result.error
    }

    if (result.status) {
      throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
    }
  }

  try {
    const hashes = {}

    for (const name of ['ui', 'motion']) {
      const pack = join(directory, 'packs', name)

      mkdirSync(pack, { recursive: true })
      run(
        'bun',
        ['pm', 'pack', '--ignore-scripts', '--destination', pack],
        join(repo, 'packages', name),
      )

      const archive = join(
        pack,
        readdirSync(pack).find((file) => file.endsWith('.tgz')),
      )

      hashes[name] = createHash('sha256').update(readFileSync(archive)).digest('hex')

      const target = join(directory, 'node_modules/@octane-xplat', name)

      mkdirSync(target, { recursive: true })
      run('tar', ['-xzf', archive, '--strip-components=1', '-C', target], directory)
    }

    const peers = [
      'octane',
      '@octane-xplat/jsx',
      '@octane-xplat/lib',
      '@octane-xplat/platform',
      '@octane-xplat/camera',
      'motion-dom',
      '@formatjs/intl-getcanonicallocales',
      '@formatjs/intl-locale',
      '@formatjs/intl-segmenter',
    ]

    for (const name of peers) {
      const source = ['ui', 'motion']
        .map((owner) => join(repo, 'packages', owner, 'node_modules', name))
        .find(existsSync)

      if (!source) {
        throw new Error(`Missing installed gesture consumer dependency: ${name}`)
      }

      const target = join(directory, 'node_modules', name)

      mkdirSync(dirname(target), { recursive: true })
      symlinkSync(source, target, 'dir')
    }

    const root = join(directory, 'fixture')

    cpSync(fixture, root, { recursive: true, filter: (source) => !source.includes('node_modules') })
    return {
      root,
      directory,
      hashes,
      dispose: () => rmSync(directory, { recursive: true, force: true }),
    }
  } catch (error) {
    rmSync(directory, { recursive: true, force: true })
    throw error
  }
}
