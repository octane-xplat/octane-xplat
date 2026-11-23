// The Mason engine ships prebuilt inside this package for both supported
// Linux arches so app builds do not need a Rust toolchain; these checks pin
// the shipping contract. Modelled on packages/macos-appkit's prebuilt test.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
const prebuiltDir = join(packageRoot, 'platforms', 'linux', 'prebuilt')
const prebuilt = JSON.parse(readFileSync(join(prebuiltDir, 'manifest.json'), 'utf8'))

const LIB = 'libxplatmason-gtk.so'
const TYPELIB = 'XplatMason-1.0.typelib'
const ELF_MACHINE = { x86_64: 0x3e, aarch64: 0xb7 }

// ELF64 constants — enough of the format to read the dynamic string table.
const PT_LOAD = 1
const PT_DYNAMIC = 2
const DT_NEEDED = 1
const DT_STRTAB = 5
const DT_STRSZ = 10
const DT_SONAME = 14
const DT_RPATH = 15
const DT_RUNPATH = 29

function packageFile(path) {
  return join(packageRoot, path)
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

/** Dynamic-section entries of an ELF64 shared object, decoded without
 *  readelf/objdump so the test runs on every dev host. */
function elfDynamic(bytes) {
  const phoff = Number(bytes.readBigUInt64LE(0x20))
  const phentsize = bytes.readUInt16LE(0x36)
  const phnum = bytes.readUInt16LE(0x38)
  const loads = []
  let dynamic = null

  for (let i = 0; i < phnum; i++) {
    const ph = phoff + i * phentsize
    const type = bytes.readUInt32LE(ph)

    if (type === PT_LOAD) {
      loads.push({
        vaddr: Number(bytes.readBigUInt64LE(ph + 0x10)),
        offset: Number(bytes.readBigUInt64LE(ph + 0x8)),
        size: Number(bytes.readBigUInt64LE(ph + 0x20)),
      })
    } else if (type === PT_DYNAMIC) {
      dynamic = { offset: Number(bytes.readBigUInt64LE(ph + 0x8)) }
    }
  }

  const toOffset = (vaddr) => {
    const seg = loads.find((s) => vaddr >= s.vaddr && vaddr < s.vaddr + s.size)

    return seg ? seg.offset + (vaddr - seg.vaddr) : null
  }

  const entries = []

  for (let off = dynamic.offset; ; off += 16) {
    const tag = Number(bytes.readBigInt64LE(off))
    const val = Number(bytes.readBigUInt64LE(off + 8))

    entries.push({ tag, val })
    if (tag === 0) {
      break
    }
  }

  const strtab = toOffset(entries.find((e) => e.tag === DT_STRTAB).val)
  const strsz = entries.find((e) => e.tag === DT_STRSZ).val
  const stringAt = (off) => {
    const start = strtab + off
    let end = start

    while (end < strtab + strsz && bytes[end] !== 0) {
      end++
    }

    return bytes.toString('utf8', start, end)
  }

  return { entries, stringAt }
}

test('the package publishes the prebuilt engine files and license', () => {
  assert.ok(manifest.files.includes('platforms'))
  assert.ok(existsSync(packageFile('platforms/linux/licenses/nativescript-mason.txt')))

  // The package.json export lets the CLI preset resolve the installed
  // package directory from an app.
  assert.equal(manifest.exports['./package.json'], './package.json')
})

test('the manifest covers both architectures with matching bytes', () => {
  assert.equal(prebuilt.baseline.image, 'ubuntu:24.04')
  assert.equal(prebuilt.baseline['minimum-glibc'], '2.39')
  assert.ok(prebuilt.baseline.gtk, 'GTK build version recorded')

  for (const arch of ['x86_64', 'aarch64']) {
    const entry = prebuilt.architectures[arch]

    assert.ok(entry, `manifest entry for ${arch}`)
    assert.equal(entry.revision, '0cdc3c80ea1b7cff74ce6b723f1d10a11f983a0d')
    assert.equal(entry.sha256[LIB], sha256(join(prebuiltDir, arch, LIB)), `${arch} .so sha`)
    assert.equal(
      entry.sha256[TYPELIB],
      sha256(join(prebuiltDir, arch, TYPELIB)),
      `${arch} typelib sha`,
    )
  }
})

test('each shipped .so targets its directory architecture', () => {
  for (const [arch, machine] of Object.entries(ELF_MACHINE)) {
    const bytes = readFileSync(join(prebuiltDir, arch, LIB))

    assert.equal(bytes.readUInt32LE(0), 0x464c457f, `${arch} is ELF`)
    assert.equal(bytes.readUInt16LE(18), machine, `${arch} e_machine`)
  }
})

test('the soname is libxplatmason-gtk.so and no absolute RUNPATH ships', () => {
  for (const arch of Object.keys(ELF_MACHINE)) {
    const { entries, stringAt } = elfDynamic(readFileSync(join(prebuiltDir, arch, LIB)))

    const soname = entries.find((e) => e.tag === DT_SONAME)

    assert.ok(soname, `${arch} has DT_SONAME`)
    assert.equal(stringAt(soname.val), LIB, `${arch} soname`)

    for (const e of entries.filter((e) => e.tag === DT_RPATH || e.tag === DT_RUNPATH)) {
      assert.doesNotMatch(stringAt(e.val), /^\//, `${arch} absolute rpath`)
    }

    // The facade must resolve its runtime deps by soname, not by path.
    const needed = entries.filter((e) => e.tag === DT_NEEDED).map((e) => stringAt(e.val))

    assert.ok(
      needed.some((n) => n.startsWith('libgtk-4.so')),
      `${arch} links libgtk-4 (got ${needed.join(', ')})`,
    )
    assert.ok(
      needed.some((n) => n.startsWith('libjson-glib')),
      `${arch} links json-glib (got ${needed.join(', ')})`,
    )
  }
})
