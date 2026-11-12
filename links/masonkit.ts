// Install the built local fork without changing the authored manifest or lock.
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const core = process.argv.includes('--core')
const leaf = core ? 'nativescript-mason-core' : 'nativescript-masonkit'
const dist = join(root, 'links/nativescript-mason/dist/packages', leaf)
const name = `@octane-xplat/${leaf}`

if (!existsSync(join(dist, 'package.json'))) {
  throw new Error(`Build the local fork first: ${dist}/package.json is missing`)
}

if (JSON.parse(readFileSync(join(dist, 'package.json'), 'utf8')).name !== name) {
  throw new Error(`Expected ${name} in ${dist}`)
}

const file = join(root, 'package.json')
const before = readFileSync(file, 'utf8')
const pkg = JSON.parse(before)

pkg.overrides = { ...pkg.overrides, [name]: `link:${dist}` }

const temporary = JSON.stringify(pkg, null, '\t') + '\n'
let signalCode = 0
const interrupt = () => {
  signalCode = 130
}

const terminate = () => {
  signalCode = 143
}

process.on('SIGINT', interrupt)
process.on('SIGTERM', terminate)
try {
  writeFileSync(file, temporary)

  const result = spawnSync('bun', ['install', '--ignore-scripts', '--no-save', '--force'], {
    cwd: root,
    stdio: 'inherit',
  })

  if (result.error) {
    throw result.error
  }

  process.exitCode = signalCode || result.status || (result.signal ? 1 : 0)

  if (core && process.exitCode === 0) {
    // Bun links this out-of-workspace dist without installing its dependencies
    // there. Resolve the consumer's declared copies so native discovery and
    // Vite follow the same dependency graph through the external package.
    const consumer = createRequire(join(root, 'apps/mobile/package.json'))
    const manifest = JSON.parse(readFileSync(join(dist, 'package.json'), 'utf8'))

    for (const dependency of Object.keys(manifest.dependencies ?? {})) {
      const target = join(dist, 'node_modules', dependency)

      if (existsSync(join(target, 'package.json'))) {
        continue
      }

      const source = dirname(consumer.resolve(`${dependency}/package.json`))

      mkdirSync(dirname(target), { recursive: true })
      symlinkSync(source, target, 'dir')
    }
  }
} finally {
  if (readFileSync(file, 'utf8') !== temporary) {
    console.error(
      'package.json changed during local installation; preserve those edits and remove the temporary MasonKit override manually.',
    )

    process.exitCode = 1
  } else {
    writeFileSync(file, before)
  }

  process.off('SIGINT', interrupt)
  process.off('SIGTERM', terminate)
}
