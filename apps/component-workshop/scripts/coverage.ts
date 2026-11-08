import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const catalog: Record<string, { package: string; symbol?: string; file?: string }> = JSON.parse(
  readFileSync(resolve(root, 'catalog.json'), 'utf8'),
)

const expected = new Set<string>()

for (const [file, pkg] of [
  ['index.shared.ts', '@octane-xplat/ui'],
  ['chat/index.ts', '@octane-xplat/ui/chat'],
  ['markdown/index.ts', '@octane-xplat/ui/markdown'],
]) {
  const source = readFileSync(resolve(root, '../../packages/ui/src', file), 'utf8')

  for (const match of source.matchAll(/export\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)/g)) {
    if (
      pkg === '@octane-xplat/ui' &&
      !match[2].includes('/components/') &&
      !match[2].endsWith('.tsrx')
    ) {
      continue
    }

    for (const binding of match[1].split(',')) {
      const name = binding.trim()

      // Context objects are dependencies, not visual component exports.
      if (!/^[A-Z][A-Za-z0-9]*$/.test(name) || name.endsWith('Context')) {
        continue
      }

      expected.add(`${pkg}#${name}`)
    }
  }
}

for (const directory of readdirSync(resolve(root, '../../packages'))) {
  if (['ui', 'workshop'].includes(directory)) {
    continue
  }

  const owner = resolve(root, '../../packages', directory)

  if (!existsSync(resolve(owner, 'src/index.ts'))) {
    continue
  }

  const manifest = JSON.parse(readFileSync(resolve(owner, 'package.json'), 'utf8'))

  if (manifest.private) {
    continue
  }

  const source = readFileSync(resolve(owner, 'src/index.ts'), 'utf8')

  for (const match of source.matchAll(/export\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)/g)) {
    if (!/\.(tsrx|tsx)$/.test(match[2])) {
      continue
    }

    for (const binding of match[1].split(',')) {
      const name = binding.trim()

      if (/^[A-Z][A-Za-z0-9]*$/.test(name)) {
        expected.add(`${manifest.name}#${name}`)
      }
    }
  }
}

const actual = new Set(
  Object.entries(catalog).map(([name, entry]) => `${entry.package}#${entry.symbol ?? name}`),
)

const missing = [...expected].filter((id) => !actual.has(id))
const unknown = [...actual].filter((id) => !expected.has(id))
const files = readdirSync(resolve(root, 'src/stories'))

for (const file of files) {
  const key = file.replace(/\.stories(?:\.web)?\.ts$/, '')

  if (!(key in catalog)) {
    unknown.push(file)
  }
}

for (const [name, entry] of Object.entries(catalog)) {
  const file = entry.file ?? `${name}.stories.web.ts`

  if (!files.includes(file)) {
    missing.push(file)
  } else if (
    !readFileSync(resolve(root, 'src/stories', file), 'utf8').includes(
      `componentId: '${entry.package}#${entry.symbol ?? name}'`,
    )
  ) {
    missing.push(`identity in ${file}`)
  }
}

if (missing.length || unknown.length) {
  throw new Error(`Workshop coverage: missing ${missing.join(', ')}; unknown ${unknown.join(', ')}`)
}

console.log(
  `Workshop coverage: ${expected.size} public UI, Chat, Markdown and visual leaf exports have stories`,
)
