import { execFileSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'

import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const workshop = fileURLToPath(new URL('..', import.meta.url))
const require = createRequire(import.meta.url)
const packageName = '@octane-xplat/astryx-sandbox'
let packageRoot = dirname(require.resolve(`${packageName}/styles.css`))

// Locate the package owning the resolved export, including in an installed archive.
for (;;) {
  if (existsSync(join(packageRoot, 'package.json'))) {
    const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))

    if (manifest.name === packageName) {
      break
    }
  }

  const parent = dirname(packageRoot)

  if (parent === packageRoot) {
    throw new Error(`Cannot find ${packageName} package root`)
  }

  packageRoot = parent
}

const scratchParent = join(homedir(), 'agent-scratch', 'octane-xplat')

mkdirSync(scratchParent, { recursive: true })

const scratch = mkdtempSync(join(scratchParent, 'workshop-packed-sandbox-'))

try {
  execFileSync(
    'bun',
    [
      'pm',
      'pack',
      '--ignore-scripts',
      '--gzip-level',
      '1',
      '--filename',
      join(scratch, 'sandbox.tgz'),
      '--quiet',
    ],
    { cwd: packageRoot, stdio: 'inherit' },
  )

  const fixture = join(scratch, 'workshop')
  const packageDir = join(fixture, 'node_modules', packageName)
  const scripts = join(fixture, 'scripts')

  mkdirSync(packageDir, { recursive: true })
  mkdirSync(scripts, { recursive: true })
  execFileSync('tar', [
    '-xzf',
    join(scratch, 'sandbox.tgz'),
    '-C',
    packageDir,
    '--strip-components=1',
  ])

  cpSync(join(workshop, 'scripts', 'copy-assets.ts'), join(scripts, 'copy-assets.ts'))

  const catalog: Record<string, { module: string }> = JSON.parse(
    readFileSync(join(workshop, 'catalog.json'), 'utf8'),
  )

  const entries = Object.entries(catalog).filter(([, entry]) =>
    entry.module.startsWith(`${packageName}/examples/`),
  )

  if (!entries.length) {
    throw new Error('Workshop catalog has no sandbox examples')
  }

  writeFileSync(join(fixture, 'catalog.json'), JSON.stringify(Object.fromEntries(entries)))

  const packedRequire = createRequire(join(fixture, 'package.json'))

  for (const [, entry] of entries) {
    packedRequire.resolve(entry.module)
  }

  packedRequire.resolve(`${packageName}/styles.css`)
  packedRequire.resolve(`${packageName}/icons`)
  execFileSync(process.execPath, [join(scripts, 'copy-assets.ts')], {
    cwd: fixture,
    stdio: 'inherit',
  })

  console.log(`Workshop: ${entries.length} catalog entries resolve from packed sandbox`)
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
