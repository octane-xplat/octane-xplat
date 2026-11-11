import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { extract, type ExtractedTweak } from '../../src/vite/extract.ts'
import { saveOverrides } from '../../src/vite/save.ts'
import type { TweakEntry, TweakValue } from '../../src/protocol.ts'

function dir(t: { after(fn: () => void): void }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tweaks-save-'))

  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  return root
}

function buildManifest(root: string, files: Record<string, string>) {
  const manifest = new Map<string, { entry: TweakEntry; tweak: ExtractedTweak }>()

  for (const [file, code] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), code)
    for (const tweak of extract(code, file).tweaks) {
      manifest.set(tweak.id, {
        entry: {
          id: tweak.id,
          file,
          name: tweak.name,
          group: tweak.group,
          input: tweak.input,
          value: tweak.value,
          writable: tweak.writable,
          reason: tweak.reason,
        },
        tweak,
      })
    }
  }

  return manifest
}

function isDirtyFactory(
  manifest: Map<string, { entry: TweakEntry }>,
  overrides: Map<string, TweakValue>,
) {
  return (id: string) => {
    const override = overrides.get(id)

    return override !== undefined && override !== (manifest.get(id)?.entry.value ?? null)
  }
}

const FILE_A = `import { useTweak } from '@octane-xplat/tweaks'
const a = useTweak(8)
const b = useTweak("hello")
`

const FILE_B = `import { useTweak } from '@octane-xplat/tweaks'
const c = useTweak(-1.5)
`

test('save writes overrides across files and reports', async (t) => {
  const root = dir(t)
  const files = { 'src/a.tsx': FILE_A, 'src/b.tsx': FILE_B }
  const manifest = buildManifest(root, files)
  const overrides = new Map<string, TweakValue>([
    ['src/a.tsx#a', 20],
    ['src/a.tsx#b', "it's"],
    ['src/b.tsx#c', -9],
  ])

  const result = await saveOverrides({
    root,
    manifest,
    overrides,
    isDirty: isDirtyFactory(manifest, overrides),
  })

  assert.equal(result.ok, true)
  assert.deepEqual(result.errors, [])
  assert.deepEqual(result.saved.sort(), ['src/a.tsx', 'src/b.tsx'])

  const a = fs.readFileSync(path.join(root, 'src/a.tsx'), 'utf8')

  assert.match(a, /useTweak\(20\)/)
  assert.match(a, /useTweak\("it's"\)/) // hello was double-quoted
  assert.match(fs.readFileSync(path.join(root, 'src/b.tsx'), 'utf8'), /useTweak\(-9\)/)
})

test('single-quoted literals keep their quote style on save', async (t) => {
  const root = dir(t)
  const files = {
    'src/a.tsx': `import { useTweak } from '@octane-xplat/tweaks'\nconst s = useTweak('hi')\n`,
  }

  const manifest = buildManifest(root, files)
  const overrides = new Map<string, TweakValue>([['src/a.tsx#s', 'say "hi"']])
  const result = await saveOverrides({
    root,
    manifest,
    overrides,
    isDirty: isDirtyFactory(manifest, overrides),
  })

  assert.equal(result.ok, true)
  assert.match(fs.readFileSync(path.join(root, 'src/a.tsx'), 'utf8'), /useTweak\('say "hi"'\)/)
})

test('a file that changed so the id vanished reports an error and keeps others', async (t) => {
  const root = dir(t)
  const files = { 'src/a.tsx': FILE_A, 'src/b.tsx': FILE_B }
  const manifest = buildManifest(root, files)

  // Stale: remove the #a call from disk after manifest build.
  fs.writeFileSync(path.join(root, 'src/a.tsx'), `const a = 8\nconst b = useTweak("hello")\n`)

  const overrides = new Map<string, TweakValue>([
    ['src/a.tsx#a', 20],
    ['src/b.tsx#c', 7],
  ])

  const result = await saveOverrides({
    root,
    manifest,
    overrides,
    isDirty: isDirtyFactory(manifest, overrides),
  })

  assert.equal(result.ok, false)
  assert.match(result.errors.find((e) => e.id === 'src/a.tsx#a')?.message ?? '', /no longer found/)
  assert.match(fs.readFileSync(path.join(root, 'src/b.tsx'), 'utf8'), /useTweak\(7\)/)
})

test('a failed write rolls back files already written', async (t) => {
  const root = dir(t)
  const files = { 'src/a.tsx': FILE_A, 'src/b.tsx': FILE_B }
  const manifest = buildManifest(root, files)

  // Make src/b.tsx unwritable: the write fails after src/a.tsx was written.
  fs.chmodSync(path.join(root, 'src/b.tsx'), 0o444)
  t.after(() => {
    try {
      fs.chmodSync(path.join(root, 'src/b.tsx'), 0o644)
    } catch {}
  })

  const overrides = new Map<string, TweakValue>([
    ['src/a.tsx#a', 20],
    ['src/b.tsx#c', 7],
  ])

  const result = await saveOverrides({
    root,
    manifest,
    overrides,
    isDirty: isDirtyFactory(manifest, overrides),
  })

  assert.equal(result.ok, false)
  assert.match(result.errors.at(-1)?.message ?? '', /write failed/)
  // src/a.tsx must have been restored to its original content.
  assert.equal(fs.readFileSync(path.join(root, 'src/a.tsx'), 'utf8'), FILE_A)
})

test('non-writable dirty entries are reported as errors', async (t) => {
  const root = dir(t)
  const files = {
    'src/a.tsx': `import { useTweak } from '@octane-xplat/tweaks'\nconst c = useTweak(CONFIG)\n`,
  }

  const manifest = buildManifest(root, files)
  const overrides = new Map<string, TweakValue>([['src/a.tsx#c', 1]])
  const result = await saveOverrides({
    root,
    manifest,
    overrides,
    isDirty: isDirtyFactory(manifest, overrides),
  })

  assert.equal(result.ok, false)
  assert.match(result.errors[0].message, /not writable|not a literal/)
})
