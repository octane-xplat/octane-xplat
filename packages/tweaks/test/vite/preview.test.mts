import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { extract, type ExtractedTweak } from '../../src/vite/extract.ts'
import { extractStyles, type StyleSite } from '../../src/vite/styles.ts'
import { planSave, saveOverrides } from '../../src/vite/save.ts'
import { previewSave } from '../../src/vite/preview.ts'
import type { TweakEntry, TweakValue } from '../../src/protocol.ts'

function dir(t: { after(fn: () => void): void }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tweaks-preview-'))

  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  return root
}

function buildManifests(root: string, files: Record<string, string>) {
  const manifest = new Map<string, { entry: TweakEntry; tweak: ExtractedTweak }>()
  const styleManifest = new Map<string, StyleSite>()

  for (const [file, code] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), code)
    for (const site of extractStyles(code, file).sites) {
      styleManifest.set(site.entry.id, site)
    }

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

  return { manifest, styleManifest }
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

// Apply a unified-diff body back to the original text. Honesty check: the
// preview diff must reconstruct exactly what Save writes.
function applyUnifiedDiff(before: string, diff: string): string {
  const lines = diff.split('\n')
  const out: string[] = []
  let cursor = 0
  const src = before.split('\n')

  for (const line of lines) {
    const m = line.match(/^@@ -(\d+),(\d+) \+(\d+),(\d+) @@$/)

    if (m) {
      const os = Number(m[1]) - 1

      while (cursor < os) {
        out.push(src[cursor++])
      }

      cursor = os + Number(m[2])
      continue
    }

    if (line.startsWith('-')) {
      continue
    }

    if (line.startsWith('+')) {
      out.push(line.slice(1))
    } else if (line.startsWith(' ')) {
      out.push(line.slice(1))
    }
  }

  while (cursor < src.length) {
    out.push(src[cursor++])
  }

  return out.join('\n')
}

const FILE_A = `import { useTweak } from '@octane-xplat/tweaks'
const a = useTweak(8)
const b = useTweak("hello")
`

const FILE_B = `import { useTweak } from '@octane-xplat/tweaks'
const c = useTweak(-1.5)
`

test('preview diffs match what Save writes, per file', async (t) => {
  const root = dir(t)
  const files = { 'src/a.tsx': FILE_A, 'src/b.tsx': FILE_B }
  const { manifest, styleManifest } = buildManifests(root, files)
  const overrides = new Map<string, TweakValue>([
    ['src/a.tsx#a', 20],
    ['src/a.tsx#b', 'hi'],
    ['src/b.tsx#c', -9],
  ])

  const opts = {
    root,
    manifest,
    styleManifest,
    overrides,
    isDirty: isDirtyFactory(manifest, overrides),
  }

  const plan = await planSave(opts)
  const preview = await previewSave(opts)

  assert.deepEqual(preview.errors, [])
  assert.equal(preview.truncated, false)
  assert.deepEqual(
    preview.files.map((f) => f.file),
    plan.writes.map((w) => w.file),
  )

  // The previewed diff reconstructs the planned write for every file.
  for (let i = 0; i < plan.writes.length; i++) {
    assert.equal(
      applyUnifiedDiff(plan.writes[i].before, preview.files[i].diff),
      plan.writes[i].after,
      `diff for ${plan.writes[i].file}`,
    )
  }

  assert.match(
    preview.files.find((f) => f.file === 'src/a.tsx')!.diff,
    /^-const a = useTweak\(8\)$/m,
  )

  assert.match(
    preview.files.find((f) => f.file === 'src/a.tsx')!.diff,
    /^\+const a = useTweak\(20\)$/m,
  )

  // And Save writes the same content the preview was computed from.
  const result = await saveOverrides(opts)

  assert.equal(result.ok, true)
  for (const write of plan.writes) {
    assert.equal(fs.readFileSync(path.join(root, write.file), 'utf8'), write.after)
  }
})

test('preview covers style drafts and unmounted dirty entries', async (t) => {
  const root = dir(t)
  const STYLE = `export function App() {
	return <View style={{ borderRadius: 8, padding: 16 }} />
}
`

  const { manifest, styleManifest } = buildManifests(root, { 'src/App.tsx': STYLE })
  const siteId = [...styleManifest.keys()][0]
  const styleDrafts = new Map([[siteId, { set: { padding: 24 }, delete: ['borderRadius'] }]])
  const opts = {
    root,
    manifest,
    styleManifest,
    styleDrafts,
    overrides: new Map<string, TweakValue>(),
    isDirty: () => false,
    isStyleDirty: () => true,
  }

  const preview = await previewSave(opts)

  assert.equal(preview.files.length, 1)

  const diff = preview.files[0].diff

  assert.match(diff, /^-.*borderRadius: 8/m)
  assert.match(diff, /^\+.*padding: 24/m)

  const plan = await planSave(opts)

  assert.equal(applyUnifiedDiff(plan.writes[0].before, diff), plan.writes[0].after)
})

test('preview degrades gracefully under byte caps', async (t) => {
  const root = dir(t)
  const lines = Array.from({ length: 60 }, (_, i) => `const v${i} = useTweak(${i})`)
  const code = `import { useTweak } from '@octane-xplat/tweaks'\n${lines.join('\n')}\n`
  const { manifest, styleManifest } = buildManifests(root, { 'src/a.tsx': code })
  // Dirty entries spread far apart → many hunks.
  const overrides = new Map<string, TweakValue>([
    ['src/a.tsx#v0', 1000],
    ['src/a.tsx#v30', 1030],
    ['src/a.tsx#v59', 1059],
  ])

  const opts = {
    root,
    manifest,
    styleManifest,
    overrides,
    isDirty: isDirtyFactory(manifest, overrides),
  }

  const full = await previewSave(opts)
  const capped = await previewSave(opts, { maxFileBytes: 80, maxTotalBytes: 1000 })

  assert.equal(capped.truncated, true)
  assert.ok(capped.files[0].diff.length <= 84, 'diff cut at the per-file cap')
  assert.match(capped.files[0].diff, /…$/)

  // Whole-file truncation: budget smaller than one diff keeps an empty list.
  const tiny = await previewSave(opts, { maxFileBytes: 1_000_000, maxTotalBytes: 10 })

  assert.equal(tiny.truncated, true)
  assert.equal(tiny.files.length, 0)
  assert.ok(full.files[0].diff.length > 80)
})

test('a plan with errors still previews the writable files', async (t) => {
  const root = dir(t)
  const { manifest, styleManifest } = buildManifests(root, {
    'src/a.tsx': FILE_A,
    'src/b.tsx': FILE_B,
  })

  // Stale: #a vanished from disk.
  fs.writeFileSync(path.join(root, 'src/a.tsx'), `const b = useTweak("hello")\n`)

  const overrides = new Map<string, TweakValue>([
    ['src/a.tsx#a', 20],
    ['src/b.tsx#c', 7],
  ])

  const preview = await previewSave({
    root,
    manifest,
    styleManifest,
    overrides,
    isDirty: isDirtyFactory(manifest, overrides),
  })

  assert.equal(preview.files.length, 1)
  assert.equal(preview.files[0].file, 'src/b.tsx')
  assert.match(preview.errors.find((e) => e.id === 'src/a.tsx#a')?.message ?? '', /no longer found/)
})
