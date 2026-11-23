import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export function writeFakeGtkRuntime(root, architecture = 'x86_64') {
  const elf = Buffer.alloc(20)
  elf.set([0x7f, 0x45, 0x4c, 0x46, 2, 1])
  elf.writeUInt16LE(architecture === 'x86_64' ? 62 : 183, 18)

  const files = {
    'ns-linux': elf,
    'lib/libmason_c.so': elf,
    'lib/libxplatmason-gtk.so': elf,
    'gi.json': '{}',
    'icu/icudt77l.dat': 'icu data',
    [`metadata-${architecture}.bin`]: 'SDK metadata',
    'metadata/mason.bin': 'Mason metadata',
    'metadata/xplatmason.bin': 'facade metadata',
    'metadata/gtk-matrix.bin': 'GTK matrix metadata',
    'metadata/webkit.bin': 'WebKit and libsoup metadata',
    'typings/index.d.ts': 'export {}',
  }
  const hashes = {}
  for (const [name, bytes] of Object.entries(files)) {
    const path = join(root, name)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, bytes)
    hashes[name] = createHash('sha256').update(bytes).digest('hex')
  }
  writeFileSync(
    join(root, 'manifest.json'),
    JSON.stringify({ version: 1, architecture, files: hashes }),
  )
  return root
}
