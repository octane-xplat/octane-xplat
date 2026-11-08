// Package-manager selection for the creator: --package-manager > the
// invoking tool's user agent > the installed-manager probe > prompt/fallback.
// Bun is the historical default, so it wins every tie.
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'

export type PackageManager = 'bun' | 'pnpm'

export type ManagerSource = 'flag' | 'user-agent' | 'only-installed' | 'prompt' | 'fallback'

export type ManagerDecision =
  | {
      kind: 'use'
      manager: PackageManager
      source: Exclude<ManagerSource, 'prompt'>
      installed: PackageManager[]
    }
  // Both managers installed, interactive, no flag/user-agent — the caller
  // joins a clack session and asks.
  | { kind: 'prompt'; options: PackageManager[] }
  // Neither installed — scaffold the Bun variant, skip install, warn.
  | { kind: 'missing'; manager: 'bun' }

const managers: PackageManager[] = ['bun', 'pnpm']

/** The tool that launched the creator (`bun create`, `pnpm dlx`, `npx`, …). */
export function managerFromUserAgent(ua: string | undefined): PackageManager | undefined {
  const tool = ua?.split(' ')[0]?.split('/')[0]

  return tool === 'bun' || tool === 'pnpm' ? tool : undefined
}

/** The manager's version, or undefined when it is not runnable on PATH. */
export function managerVersion(manager: PackageManager): string | undefined {
  const result = spawnSync(manager, ['--version'], {
    encoding: 'utf8',
    // A manager pinned by the caller's cwd package.json can refuse to run;
    // probe from a neutral directory.
    cwd: tmpdir(),
    shell: process.platform === 'win32',
  })

  if (result.error || result.status !== 0) {
    return undefined
  }

  return result.stdout.trim()
}

/** Managers runnable on this machine, in fixed order. */
export function installedManagers(): PackageManager[] {
  return managers.filter((manager) => managerVersion(manager) !== undefined)
}

export function decidePackageManager(input: {
  flag?: string
  userAgent?: string
  installed: PackageManager[]
  interactive: boolean
}): ManagerDecision {
  if (input.flag !== undefined) {
    if (input.flag !== 'bun' && input.flag !== 'pnpm') {
      throw new Error('--package-manager must be bun or pnpm')
    }

    return { kind: 'use', manager: input.flag, source: 'flag', installed: input.installed }
  }

  const fromAgent = managerFromUserAgent(input.userAgent)

  if (fromAgent) {
    return { kind: 'use', manager: fromAgent, source: 'user-agent', installed: input.installed }
  }

  if (input.installed.length === 0) {
    return { kind: 'missing', manager: 'bun' }
  }

  if (input.installed.length === 1) {
    return {
      kind: 'use',
      manager: input.installed[0],
      source: 'only-installed',
      installed: input.installed,
    }
  }

  if (input.interactive) {
    return { kind: 'prompt', options: [...managers] }
  }

  return { kind: 'use', manager: 'bun', source: 'fallback', installed: input.installed }
}
