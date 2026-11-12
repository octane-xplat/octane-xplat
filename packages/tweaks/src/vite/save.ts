import fs from 'node:fs/promises'
import path from 'node:path'
import type { EditorScope, StyleDraft, TweakEntry, TweakValue } from '../protocol.ts'
import { extract, type ExtractedTweak } from './extract.ts'
import { serializeLiteral } from './serialize.ts'
import { extractStyles, type StyleSite } from './styles.ts'
import { applySplices, planStyleEdit } from './stylewrite.ts'

export interface SaveError {
  id?: string
  file: string
  message: string
}

export interface SaveResult {
  ok: boolean
  saved: string[]
  errors: SaveError[]
  /** file → new content, for manifest refresh + HMR suppression. */
  writes: Map<string, string>
}

export interface Edit {
  start: number
  end: number
  text: string
}

export interface PlanOptions {
  scope?: EditorScope
  root: string
  manifest: Map<string, { entry: TweakEntry; tweak: ExtractedTweak }>
  styleManifest?: Map<string, StyleSite>
  styleDrafts?: Map<string, StyleDraft>
  overrides: Map<string, TweakValue>
  isDirty(id: string): boolean
  isStyleDirty?(id: string): boolean
}

export interface PlannedFileWrite {
  file: string
  /** Content read from disk — also the base the edits splice into. */
  before: string
  /** What Save would write. */
  after: string
  /** Splices against `before`, sorted ascending by start. */
  edits: Edit[]
}

export interface SavePlan {
  writes: PlannedFileWrite[]
  errors: SaveError[]
}

/**
 * Re-parse every touched file from disk (writeback ranges are true source
 * offsets — earlier transforms may have rewritten the served module), find each
 * dirty entry by id, and compute the serialized-override splices over its value
 * literal — without writing anything. `saveOverrides` applies this plan to
 * disk; `previewSave` diffs it for the panel's Save preview.
 */
export async function planSave(opts: PlanOptions): Promise<SavePlan> {
  const errors: SaveError[] = []
  const editsByFile = new Map<string, Edit[]>()
  const fileContents = new Map<string, string>()

  for (const [id, override] of opts.overrides) {
    if (opts.scope === 'styles' || !opts.isDirty(id)) {
      continue
    }

    const found = opts.manifest.get(id)
    const file = found?.entry.file ?? id.split('#')[0]

    if (!found) {
      errors.push({ id, file, message: 'entry not in manifest' })
      continue
    }

    if (!found.tweak.writable) {
      errors.push({
        id,
        file,
        message: found.tweak.reason ?? 'entry is not writable',
      })

      continue
    }

    const abs = path.join(opts.root, file)
    let code = fileContents.get(file)

    if (code === undefined) {
      try {
        code = await fs.readFile(abs, 'utf8')
        fileContents.set(file, code)
      } catch (error) {
        errors.push({ id, file, message: `cannot read file: ${(error as Error).message}` })
        continue
      }
    }

    const fresh = extract(code, file).tweaks.find((t) => t.id === id)

    if (!fresh || !fresh.valueRange) {
      errors.push({ id, file, message: 'entry no longer found in file (file changed?)' })
      continue
    }

    let edits = editsByFile.get(file)

    if (!edits) {
      editsByFile.set(file, (edits = []))
    }

    edits.push({
      start: fresh.valueRange.start,
      end: fresh.valueRange.end,
      text: serializeLiteral(override, fresh.quote === "'" ? "'" : '"'),
    })
  }

  // Style sites: plan splices from the draft, then verify the re-extracted
  // file contains exactly the expected property set — the safety net. Any
  // mismatch aborts the whole save before a single write.
  for (const [id, draft] of opts.styleDrafts ?? new Map<string, StyleDraft>()) {
    if (opts.scope === 'tweaks' || !opts.isStyleDirty?.(id)) {
      continue
    }

    const site = opts.styleManifest?.get(id)
    const file = site?.entry.file ?? id.split('#')[0]

    if (!site) {
      errors.push({ id, file, message: 'style site not in manifest' })
      continue
    }

    if (!site.entry.writable) {
      errors.push({ id, file, message: site.entry.reason ?? 'style site is not writable' })
      continue
    }

    const abs = path.join(opts.root, file)
    let code = fileContents.get(file)

    if (code === undefined) {
      try {
        code = await fs.readFile(abs, 'utf8')
        fileContents.set(file, code)
      } catch (error) {
        errors.push({ id, file, message: `cannot read file: ${(error as Error).message}` })
        continue
      }
    }

    // Re-extract this exact file: the site must still be there with the same
    // ranges the draft was built against.
    const fresh = extractStyles(code, file).sites.find((x) => x.entry.id === id)

    if (!fresh) {
      errors.push({ id, file, message: 'style site no longer found in file (file changed?)' })
      continue
    }

    let edits = editsByFile.get(file)

    if (!edits) {
      editsByFile.set(file, (edits = []))
    }

    for (const e of planStyleEdit(code, fresh, draft)) {
      edits.push({ start: e.start, end: e.end, text: e.text })
    }
  }

  // Verify: apply the splices in-memory, re-extract, and require the file's
  // full style-site set to still parse with the expected properties. Any
  // deviation aborts the save outright.
  for (const [id, draft] of opts.styleDrafts ?? new Map<string, StyleDraft>()) {
    if (opts.scope === 'tweaks' || !opts.isStyleDirty?.(id)) {
      continue
    }

    const site = opts.styleManifest?.get(id)

    if (!site) {
      continue
    }

    const file = site.entry.file
    const edits = editsByFile.get(file)

    if (!edits?.length) {
      continue
    }

    const code = fileContents.get(file)

    if (code === undefined) {
      continue
    }

    const next = applySplices(
      code,
      edits.slice().sort((a, b) => b.start - a.start),
    )

    let ok = false

    try {
      const sites = extractStyles(next, file).sites
      const fresh = sites.find((x) => x.entry.id === id)

      if (fresh) {
        // Expected = the ORIGINAL site's editable props minus deletes,
        // with draft set entries applied and additions merged in.
        const expected = new Map<string, unknown>()

        for (const p of site.entry.properties) {
          if (p.editable) {
            expected.set(p.path.join('.'), p.value)
          }
        }

        for (const k of draft.delete) {
          expected.delete(k)
        }

        for (const [k, v] of Object.entries(draft.set)) {
          expected.set(k, v)
        }

        const actual = new Map(
          fresh.entry.properties.filter((p) => p.editable).map((p) => [p.path.join('.'), p.value]),
        )

        ok = expected.size === actual.size && [...expected].every(([k, v]) => actual.get(k) === v)
      }
    } catch {}

    if (!ok) {
      errors.push({ id, file, message: 're-extraction mismatch after writeback — aborting save' })
      editsByFile.delete(file)
    }
  }

  // Apply edits per file in descending offset order.
  const writes: PlannedFileWrite[] = []

  for (const [file, edits] of editsByFile) {
    let code = fileContents.get(file)!

    edits.sort((a, b) => b.start - a.start)
    for (const edit of edits) {
      code = code.slice(0, edit.start) + edit.text + code.slice(edit.end)
    }

    writes.push({
      file,
      before: fileContents.get(file)!,
      after: code,
      edits: edits.slice().sort((a, b) => a.start - b.start),
    })
  }

  return { writes, errors }
}

/**
 * Apply a `planSave` plan to disk. On any write failure, already-written files
 * are restored from their original content so a failed Save never leaves a
 * half-applied set.
 */
export async function saveOverrides(opts: PlanOptions): Promise<SaveResult> {
  const { writes, errors } = await planSave(opts)
  const saved: string[] = []
  const written = new Map<string, string>()

  try {
    for (const { file, after } of writes) {
      const abs = path.join(opts.root, file)

      written.set(file, await fs.readFile(abs, 'utf8'))
      await fs.writeFile(abs, after)
      saved.push(file)
    }
  } catch (error) {
    // Roll back already-written files to their pre-save content.
    for (const [file, original] of written) {
      try {
        await fs.writeFile(path.join(opts.root, file), original)
      } catch {
        errors.push({ file, message: 'rollback failed — file left in saved state' })
      }
    }

    errors.push({ file: '', message: `write failed: ${(error as Error).message}` })
    return { ok: false, saved: [], errors, writes: new Map() }
  }

  return {
    ok: errors.length === 0,
    saved,
    errors,
    writes: new Map(writes.map((w) => [w.file, w.after])),
  }
}
