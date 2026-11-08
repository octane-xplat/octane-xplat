import { readFileSync, existsSync, mkdirSync, cpSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const catalog: Record<string, { module: string }> = JSON.parse(
  readFileSync(resolve(root, 'catalog.json'), 'utf8'),
)

const seen = new Set<string>()
const assets = new Set<string>()
function inspect(file: string) {
  if (seen.has(file) || !existsSync(file)) {
    return
  }

  seen.add(file)

  const source = readFileSync(file, 'utf8')

  for (const match of source.matchAll(/['"]\/template-assets\/([^'"`]+)['"]/g)) {
    assets.add(match[1])
  }

  for (const match of source.matchAll(/from\s*['"](\.[^'"]+)['"]/g)) {
    const base = resolve(dirname(file), match[1])
    const dependency = [
      base,
      `${base}.web.tsrx`,
      `${base}.tsrx`,
      `${base}.web.ts`,
      `${base}.ts`,
    ].find(existsSync)

    if (dependency) {
      inspect(dependency)
    }
  }
}

for (const entry of Object.values(catalog)) {
  if (entry.module.startsWith('@xplat/astryx-sandbox/examples/')) {
    inspect(
      resolve(
        root,
        '../astryx-sandbox/src/examples',
        entry.module.replace('@xplat/astryx-sandbox/examples/', ''),
      ),
    )
  } else if (entry.module.startsWith('@xplat/demos/')) {
    inspect(resolve(root, '../../packages/demos/src', entry.module.replace('@xplat/demos/', '')))
  }
}

for (const asset of assets) {
  if (asset.includes('..') || asset.startsWith('/')) {
    throw new Error(`Invalid showcase asset ${asset}`)
  }

  const source = resolve(root, '../astryx-sandbox/public/template-assets', asset)
  const destination = resolve(root, 'dist/template-assets', asset)

  if (!existsSync(source)) {
    throw new Error(`Missing showcase asset ${asset}`)
  }

  mkdirSync(dirname(destination), { recursive: true })
  cpSync(source, destination)
}

console.log(`Workshop: copied ${assets.size} referenced example assets`)
