import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const script = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../linux-runtime-release/prepare-webkit-metadata.py',
)

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'xplat webkit metadata '))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const bin = join(root, 'bin')
  const webkit = join(root, 'webkit headers')
  const soup = join(root, 'soup headers')
  for (const dir of [bin, join(webkit, 'webkit'), join(webkit, 'jsc'), join(soup, 'libsoup')]) {
    mkdirSync(dir, { recursive: true })
  }
  for (const path of [
    join(webkit, 'webkit/webkit.h'),
    join(webkit, 'jsc/jsc.h'),
    join(soup, 'libsoup/soup.h'),
  ]) {
    writeFileSync(path, '/* fixture header */\n')
  }
  const generator = join(bin, 'metadata-generator')
  writeFileSync(
    generator,
    `#!/usr/bin/env python3
import os, pathlib, sys
out = pathlib.Path(sys.argv[sys.argv.index('-output-bin') + 1])
out.write_bytes(b'fixture metadata')
if os.environ.get('XPLAT_TEST_GENERATOR_FAIL') == '1': sys.exit(7)
`,
  )
  chmodSync(generator, 0o755)
  const pkgConfig = join(bin, 'pkg-config')
  writeFileSync(
    pkgConfig,
    '#!/bin/sh\ncase "$1" in --modversion) echo 4.14.5 ;; *) echo -I/fake/gtk ;; esac\n',
  )
  chmodSync(pkgConfig, 0o755)
  const output = join(root, 'webkit.bin')
  const manifest = join(root, 'manifest.json')
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}` }
  const run = (extra = {}) =>
    spawnSync(
      'python3',
      [
        script,
        '--generator',
        generator,
        '--webkit-include',
        webkit,
        '--soup-include',
        soup,
        '--output',
        output,
        '--manifest',
        manifest,
      ],
      { encoding: 'utf8', env: { ...env, ...extra } },
    )
  return { run, output, manifest }
}

test('writes metadata and a hash manifest, then refuses to replace them', (t) => {
  const { run, output, manifest } = fixture(t)
  const first = run()
  assert.equal(first.status, 0, first.stderr)
  assert.equal(readFileSync(output, 'utf8'), 'fixture metadata')
  const record = JSON.parse(readFileSync(manifest, 'utf8'))
  assert.equal(record.gtkVersion, '4.14.5')
  assert.deepEqual(record.gtkIncludes, ['-I/fake/gtk'])
  assert.equal(record.metadataSha256, createHash('sha256').update('fixture metadata').digest('hex'))
  const second = run()
  assert.notEqual(second.status, 0)
  assert.match(second.stderr, /output already exists/)
  assert.equal(readFileSync(output, 'utf8'), 'fixture metadata')
})

test('generator failure leaves neither final output nor manifest', (t) => {
  const { run, output, manifest } = fixture(t)
  const failed = run({ XPLAT_TEST_GENERATOR_FAIL: '1' })
  assert.notEqual(failed.status, 0)
  assert.equal(existsSync(output), false)
  assert.equal(existsSync(manifest), false)
})
