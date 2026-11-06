// Canonical formatter planning. No source publication or CLI command imports.
import { lstatSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import ignore, { type Ignore } from 'ignore'
import type { Formatter } from '@octane-xplat/fmt'

export interface PlannedFormatFile {
  file: string
  sourceSha256: string
  mode: number
  code: string
  changed: boolean
}

export interface FormatPlan {
  version: 1
  kind: 'stdin' | 'files'
  diagnostics: string[]
  files: PlannedFormatFile[]
  code?: string
  changed?: boolean
}

export function sourceDigest(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

export async function planFormat(
  cwd: string,
  inputs: string[],
  stdin: { path: string; source: string } | null,
  loadFormatter: () => Promise<Formatter>,
): Promise<FormatPlan> {
  const formatter = await loadFormatter()
  const plan: FormatPlan = {
    version: 1,
    kind: stdin ? 'stdin' : 'files',
    diagnostics: [],
    files: [],
  }
  const format = async (path: string, source: string) => {
    const result = await formatter.formatText({ path, source })
    if (!result.ok) {
      if (!result.diagnostics.length) {
        throw new Error('Formatter failed without diagnostics')
      }

      for (const d of result.diagnostics) {
        const at = d.line === undefined ? '' : `:${d.line}:${d.column ?? 1}`
        plan.diagnostics.push(`${d.path}${at}: ${d.stage} ${d.code} — ${d.message}`)
      }
    }
    return result
  }
  if (stdin) {
    const result = await format(stdin.path, stdin.source)
    if (result.ok) {
      plan.code = result.code
      plan.changed = result.changed
    }
  } else {
    for (const file of collectFiles(cwd, inputs, formatter)) {
      const bytes = readFileSync(file)
      const stat = statSync(file)
      const result = await format(relative(cwd, file) || file, bytes.toString('utf8'))
      if (result.ok) {
        plan.files.push({
          file,
          sourceSha256: sourceDigest(bytes),
          mode: stat.mode,
          code: result.code,
          changed: result.changed,
        })
      }
    }
  }
  // A partial successful plan must never be published after a transform error.
  if (plan.diagnostics.length) {
    plan.files = []
  }
  return plan
}

const EXTENSIONS = new Set(['js', 'mjs', 'cjs', 'jsx', 'ts', 'mts', 'cts', 'tsx', 'tsrx'])

// Mirrors packages/lint's companion-pass inventory.
const IGNORED_DIRS = new Set([
  '.git',
  '.next',
  '.nx',
  '.turbo',
  'build',
  'coverage',
  'dist',
  'graft',
  'node_modules',
  'out',
  'prior-art',
  'release',
  'tmp',
])

function collectFiles(cwd: string, inputs: string[], formatter: Formatter): string[] {
  const ignores = new Gitignores()
  ignores.load(cwd)
  const files = new Set<string>()

  const walkInto = function* (dir: string): Generator<string> {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name)
      if (entry.isSymbolicLink()) {
        continue
      }

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) {
          continue
        }

        // A nested repository carries its own config — `.git` is a dir in
        // a clone and a file in worktrees/submodules; either bounds it.
        // The scan root itself is always scanned.
        if (hasGitBoundary(abs)) {
          continue
        }

        if (ignores.isIgnored(abs)) {
          continue
        }

        ignores.load(abs)
        yield* walkInto(abs)
      } else if (entry.isFile()) {
        const ext = entry.name.split('.').pop() ?? ''
        if (EXTENSIONS.has(ext) && !ignores.isIgnored(abs)) {
          yield abs
        }
      }
    }
  }

  if (inputs.length === 0) {
    for (const file of walkInto(cwd)) {
      if (!formatter.shouldIgnore(file)) {
        files.add(file)
      }
    }
  } else {
    for (const input of inputs) {
      const abs = resolve(cwd, input)
      let stat
      try {
        stat = lstatSync(abs)
      } catch {
        throw new Error(`no such file or directory: ${input}`)
      }

      if (stat.isSymbolicLink()) {
        throw new Error(`not following symlink: ${input}`)
      }

      if (stat.isDirectory()) {
        for (const file of walkInto(abs)) {
          if (!formatter.shouldIgnore(file)) {
            files.add(file)
          }
        }
      } else {
        const ext = abs.split('.').pop() ?? ''
        if (!EXTENSIONS.has(ext)) {
          throw new Error(`unsupported extension .${ext}: ${input}`)
        }

        if (!formatter.shouldIgnore(abs)) {
          files.add(abs)
        }
      }
    }
  }
  return [...files].sort()
}

function hasGitBoundary(dir: string): boolean {
  try {
    return readdirSync(dir).some((name) => name === '.git')
  } catch {
    return false
  }
}

// One `ignore` matcher per directory that carries a .gitignore, evaluated
// against the candidate's path relative to that directory.
class Gitignores {
  matchers: Map<string, Ignore | null>
  constructor() {
    this.matchers = new Map<string, Ignore | null>()
  }
  load(dir: string): void {
    if (this.matchers.has(dir)) {
      return
    }
    let matcher: Ignore | null = null
    try {
      matcher = ignore().add(readFileSync(join(dir, '.gitignore'), 'utf8'))
    } catch {
      matcher = null
    }
    this.matchers.set(dir, matcher)
  }
  isIgnored(abs: string): boolean {
    for (const [dir, matcher] of this.matchers) {
      if (!matcher) {
        continue
      }

      const rel = relative(dir, abs)
      if (rel && !rel.startsWith('..') && matcher.ignores(rel)) {
        return true
      }
    }
    return false
  }
}
