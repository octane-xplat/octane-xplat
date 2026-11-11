// Save preview: run the same planSave the real Save uses (current disk content
// × current drafts — reverts and unmounted-site dirt included), and render each
// planned write as a unified diff. Payload is capped so a huge plan degrades
// to a truncated preview instead of an unbounded websocket frame.
import { unifiedDiff } from './diff.ts'
import { planSave, type PlanOptions, type SaveError } from './save.ts'

export interface SavePreviewFile {
  file: string
  /** Unified-diff body: @@ hunks with ' '/'-'/'+' lines. */
  diff: string
}

export interface SavePreview {
  files: SavePreviewFile[]
  /** True when the diff payload was capped — Save still applies everything. */
  truncated: boolean
  errors: SaveError[]
}

export interface PreviewLimits {
  /** Chars of diff text kept per file; longer diffs are cut with a '…' line. */
  maxFileBytes: number
  /** Total diff chars across all files before the preview truncates. */
  maxTotalBytes: number
}

const DEFAULT_LIMITS: PreviewLimits = {
  maxFileBytes: 64 * 1024,
  maxTotalBytes: 256 * 1024,
}

export async function previewSave(
  opts: PlanOptions,
  limits: PreviewLimits = DEFAULT_LIMITS,
): Promise<SavePreview> {
  const plan = await planSave(opts)
  const files: SavePreviewFile[] = []
  let truncated = false
  let budget = limits.maxTotalBytes

  for (const write of plan.writes) {
    let diff = unifiedDiff(write.before, write.edits)

    if (diff.length > limits.maxFileBytes) {
      diff = `${diff.slice(0, limits.maxFileBytes)}\n…`
      truncated = true
    }

    if (diff.length > budget) {
      truncated = true
      break
    }

    budget -= diff.length
    files.push({ file: write.file, diff })
  }

  return { files, truncated, errors: plan.errors }
}
