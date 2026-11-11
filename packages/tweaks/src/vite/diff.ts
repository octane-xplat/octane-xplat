// Unified-diff hunks for a save plan. Regions are derived from the plan's
// splices — not a generic re-diff — so the preview shows exactly the edits
// Save applies. Each splice maps to the line range covering its replaced text
// plus the "joint" line where the untouched remainder resumes; equal lines on
// a region's edges collapse back to context, which keeps pure insertions and
// whole-line deletions minimal.
import type { Edit } from './save.ts'
import { applySplices } from './stylewrite.ts'

function lineStarts(code: string): number[] {
  const starts = [0]

  for (let i = 0; i < code.length; i++) {
    if (code[i] === '\n') {
      starts.push(i + 1)
    }
  }

  return starts
}

// Greatest line index whose start offset is <= pos.
function lineAt(starts: number[], pos: number): number {
  let lo = 0
  let hi = starts.length - 1

  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1

    if (starts[mid] <= pos) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }

  return lo
}

interface Region {
  os: number // first covered old line
  oe: number // last covered old line (inclusive)
  ns: number // first covered new line
  ne: number // last covered new line (inclusive; ne < ns = nothing added)
}

/**
 * Render `edits` applied to `before` as unified-diff body text (`@@` hunks,
 * ' '/'-'/'+' lines). `edits` must be non-overlapping splices against
 * `before`, as produced by planSave.
 */
export function unifiedDiff(before: string, edits: Edit[], context = 3): string {
  const sorted = edits.slice().sort((a, b) => a.start - b.start || a.end - b.end)

  if (!sorted.length) {
    return ''
  }

  const after = applySplices(before, sorted)
  const oldLines = before.split('\n')
  const newLines = after.split('\n')
  const oldStarts = lineStarts(before)
  const newStarts = lineStarts(after)

  // A region covers the spliced lines plus the joint line where old content
  // resumes — on both sides — so surviving lines pair up for edge-trimming.
  const regions: Region[] = []
  let shift = 0

  for (const e of sorted) {
    const nStart = e.start + shift

    regions.push({
      os: lineAt(oldStarts, e.start),
      oe: lineAt(oldStarts, e.end),
      ns: lineAt(newStarts, nStart),
      ne: lineAt(newStarts, Math.min(nStart + e.text.length, after.length)),
    })

    shift += e.text.length - (e.end - e.start)
  }

  // Merge regions that share old lines (e.g. two splices on one line, or a
  // whole-line delete whose remnant another splice edits).
  const merged: Region[] = []

  for (const r of regions) {
    const last = merged[merged.length - 1]

    if (last && r.os <= last.oe) {
      last.oe = Math.max(last.oe, r.oe)
      last.ns = Math.min(last.ns, r.ns)
      last.ne = Math.max(last.ne, r.ne)
    } else {
      merged.push({ ...r })
    }
  }

  // Drop the phantom empty element split() leaves on '\n'-terminated content.
  for (const r of merged) {
    while (r.oe > r.os && r.oe === oldLines.length - 1 && oldLines[r.oe] === '') {
      r.oe--
    }

    while (r.ne > r.ns && r.ne === newLines.length - 1 && newLines[r.ne] === '') {
      r.ne--
    }

    if (r.ne === r.ns && r.ne === newLines.length - 1 && newLines[r.ne] === '') {
      r.ne = r.ns - 1
    }

    if (r.oe === r.os && r.oe === oldLines.length - 1 && oldLines[r.oe] === '') {
      r.oe = r.os - 1
    }
  }

  // Group regions into hunks: two regions share a hunk when the unchanged
  // lines between them fit in the surrounding context.
  const hunks: Region[][] = []

  for (const r of merged) {
    const hunk = hunks[hunks.length - 1]
    const prev = hunk?.[hunk.length - 1]

    if (prev && r.os - prev.oe - 1 <= 2 * context) {
      hunk.push(r)
    } else {
      hunks.push([r])
    }
  }

  const out: string[] = []

  for (const hunk of hunks) {
    const first = hunk[0]
    const last = hunk[hunk.length - 1]
    const os = Math.max(0, first.os - context)
    const oe = Math.min(oldLines.length - 1, last.oe + context)
    const ns = first.ns - (first.os - os)
    const ne = last.ne + (oe - last.oe)

    out.push(`@@ -${os + 1},${oe - os + 1} +${ns + 1},${ne - ns + 1} @@`)

    let cursor = os

    for (const r of hunk) {
      while (cursor < r.os) {
        out.push(` ${oldLines[cursor++]}`)
      }

      const removed = oldLines.slice(r.os, r.oe + 1)
      const added = newLines.slice(r.ns, r.ne + 1)
      // Trim lines the splice left untouched inside the region (remnants).
      let pre = 0

      while (pre < removed.length && pre < added.length && removed[pre] === added[pre]) {
        pre++
      }

      let suf = 0

      while (
        suf < removed.length - pre &&
        suf < added.length - pre &&
        removed[removed.length - 1 - suf] === added[added.length - 1 - suf]
      ) {
        suf++
      }

      for (let i = 0; i < pre; i++) {
        out.push(` ${removed[i]}`)
      }

      for (let i = pre; i < removed.length - suf; i++) {
        out.push(`-${removed[i]}`)
      }

      for (let i = pre; i < added.length - suf; i++) {
        out.push(`+${added[i]}`)
      }

      for (let i = removed.length - suf; i < removed.length; i++) {
        out.push(` ${removed[i]}`)
      }

      cursor = r.oe + 1
    }

    while (cursor <= oe) {
      out.push(` ${oldLines[cursor++]}`)
    }
  }

  return out.join('\n')
}
