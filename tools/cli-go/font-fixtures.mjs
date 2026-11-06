import { deflateSync } from 'node:zlib'
// A WOFF container around real sfnt tables; it exercises the actual converter.
export function asWoff(ttf) {
  const count = ttf.readUInt16BE(4),
    tables = []
  for (let i = 0; i < count; i++) {
    const at = 12 + i * 16,
      source = ttf.subarray(
        ttf.readUInt32BE(at + 8),
        ttf.readUInt32BE(at + 8) + ttf.readUInt32BE(at + 12),
      ),
      compressed = deflateSync(source)

    tables.push({
      tag: ttf.toString('latin1', at, at + 4),
      source,
      data: compressed.length < source.length ? compressed : source,
      checksum: ttf.readUInt32BE(at + 4),
    })
  }
  const output = Buffer.alloc(
    44 + count * 20 + tables.reduce((n, t) => n + Math.ceil(t.data.length / 4) * 4, 0),
  )
  output.write('wOFF')
  output.writeUInt32BE(ttf.readUInt32BE(0), 4)
  output.writeUInt32BE(output.length, 8)
  output.writeUInt16BE(count, 12)
  output.writeUInt32BE(ttf.length, 16)
  let cursor = 44 + count * 20
  tables.forEach((t, i) => {
    const at = 44 + i * 20
    output.write(t.tag, at)
    output.writeUInt32BE(cursor, at + 4)
    output.writeUInt32BE(t.data.length, at + 8)
    output.writeUInt32BE(t.source.length, at + 12)
    output.writeUInt32BE(t.checksum, at + 16)
    t.data.copy(output, cursor)
    cursor += Math.ceil(t.data.length / 4) * 4
  })
  return output
}

import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { createHash } from 'node:crypto'
export const fontCases = [
  'ttf',
  'woff',
  'woff2',
  'mono',
  'named',
  'none',
  'custom',
  'fontsource',
  'variable',
  'missing-web',
]

export function fontCase(root, dir, id) {
  const put = (file, data) => {
    const p = join(dir, file)
    mkdirSync(dirname(p), { recursive: true })
    writeFileSync(
      p,
      typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data),
    )
    return p
  }
  put('package.json', { name: 'font-app', private: true, packageManager: 'bun@1.4.4' })
  const source = id === 'custom' ? 'app-code' : 'src'
  mkdirSync(join(dir, source), { recursive: true })
  if (id === 'custom') {
    put('nativescript.config.ts', "export default { appPath: 'app-code' }\n")
  }
  put(
    source + '/style.css',
    ':root,\n.ns-root { --color-text: black; }\nbody { font-family: system-ui; }\n',
  )
  if (id !== 'missing-web') {
    put(source + '/main.web.tsrx', "import './style.css'\nexport {}\n")
  }
  const ttf = readFileSync(join(root, 'packages/app/src/assets/fonts/Geist-Variable.ttf'))
  let input = put('inputs/Geist-Variable.ttf', ttf),
    options = {}
  if (id === 'woff') {
    input = put('inputs/geist.woff', asWoff(ttf))
  }
  if (id === 'woff2') {
    input = put(
      'inputs/inter.woff2',
      readFileSync(join(root, 'packages/cli/test/fixtures/inter-latin-wght-normal.woff2')),
    )
  }
  if (id === 'mono') {
    options = { token: 'mono' }
  }
  if (id === 'named') {
    options = { name: 'Custom Face' }
  }
  if (id === 'none') {
    options = { token: 'none' }
  }
  if (id === 'fontsource') {
    input = '@fontsource/demofont'
    put('node_modules/' + input + '/package.json', { name: input, version: '1.0.0' })
    put('node_modules/' + input + '/files/demofont-latin-400-normal.woff', asWoff(ttf))
    put('node_modules/' + input + '/files/demofont-latin-700-normal.woff', asWoff(ttf))
    put('node_modules/' + input + '/latin-400.css', "@font-face { font-family: 'Demo'; }\n")
    options = { weights: [400] }
  }
  if (id === 'variable') {
    input = '@fontsource-variable/demovar'
    put('node_modules/' + input + '/package.json', { name: input, version: '1.0.0' })
    put(
      'node_modules/' + input + '/files/demovar-latin-wght-normal.woff2',
      readFileSync(join(root, 'packages/cli/test/fixtures/inter-latin-wght-normal.woff2')),
    )

    put('node_modules/' + input + '/wght.css', "@font-face { font-family: 'Demo Variable'; }\n")
  }
  return { inputs: [input], options, source: join(dir, source) }
}

export function fontTree(dir) {
  const result = {}
  function visit(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      if (entry.name === 'node_modules') {
        continue
      }

      const file = join(path, entry.name)
      if (entry.isDirectory()) {
        visit(file)
      } else if (entry.isFile()) {
        result[relative(dir, file).replaceAll('\\', '/')] = {
          sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
          mode: statSync(file).mode & 0o777,
        }
      }
    }
  }
  visit(dir)
  return result
}
