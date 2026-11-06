import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

// Disposable runs share one task/worktree folder; retained evidence stays in
// research/ or ~/dev/reports. Hashing the workspace avoids shared-host clashes.
export function scratchRun(workspace, label) {
  const key = createHash('sha256').update(workspace).digest('hex').slice(0, 8)
  const base = join(homedir(), 'agent-scratch/octane-xplat', `go-cli-${key}`)
  mkdirSync(base, { recursive: true })
  try {
    writeFileSync(
      join(base, 'README.md'),
      `Everything in this folder is disposable.\n\nOwner: native CLI rewrite (tools/cli-go).\nSource: ${workspace}\nRetained evidence: ${workspace}/research/go-cli and ~/dev/reports/octane-xplat.\nReproduce runs through the owning Turbo qualification tasks.\n`,
      { flag: 'wx' },
    )
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error
    }
  }
  return mkdtempSync(join(base, `${new Date().toISOString().slice(0, 10)}-${label}-`))
}
