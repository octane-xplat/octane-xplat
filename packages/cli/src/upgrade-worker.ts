// Compatibility policy stays shared; the native caller owns leases and processes.
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { relative } from 'node:path'
import { planUpgrade, applyUpgrade, compatibility } from './compatibility.ts'
import { packageManagerFor, packageManagerRoot } from './package-manager.ts'
import { inspectCompatibility } from './compatibility-check.ts'
import { inspectPatches, patchStateDetail } from './patches.ts'

export function upgradeOperation(request: Record<string, any>) {
  const root = realpathSync(packageManagerRoot(process.cwd()))
  const manager = packageManagerFor(root)

  if (
    typeof request.workspaceRoot !== 'string' ||
    realpathSync(request.workspaceRoot) !== root ||
    request.expectedManager !== manager
  ) {
    throw new Error('Upgrade workspace or package manager changed; retry the operation')
  }

  if (request.frameworkVersion !== compatibility.frameworkVersion) {
    throw new Error(
      `Upgrade requires the CLI worker for framework ${request.frameworkVersion}; the selected project worker provides ${compatibility.frameworkVersion}. Install the matching CLI worker before upgrading.`,
    )
  }

  const data = { version: 1, root, manager, frameworkVersion: compatibility.frameworkVersion }

  if (request.operation === 'upgrade-install') {
    // Only fixed manager names and fixed argv enter the Windows shell. Do not
    // interpolate project paths, configuration or caller-supplied arguments.
    const windows = process.platform === 'win32'
    const install = spawnSync(
      windows ? `${manager} install --no-frozen-lockfile` : manager,
      windows ? [] : ['install', '--no-frozen-lockfile'],
      {
        cwd: root,
        shell: windows,
        stdio: 'inherit',
      },
    )

    if (install.error) {
      throw install.error
    }

    return { ...data, exitCode: install.status ?? 1 }
  }

  const plan = planUpgrade(process.cwd())
  const digest = createHash('sha256').update(JSON.stringify(plan)).digest('hex')

  if (request.operation === 'upgrade-plan') {
    return { ...data, plan, digest }
  }

  if (request.operation === 'upgrade-apply') {
    if (request.digest !== digest) {
      throw new Error('Workspace changed during upgrade; rerun xplat upgrade')
    }

    applyUpgrade(plan)
    return { ...data, digest, written: plan.files.length }
  }

  if (request.operation !== 'upgrade-verify') {
    throw new Error('Unsupported upgrade operation')
  }

  const issues = plan.projects.flatMap((project) =>
    inspectCompatibility(project)
      .filter((row) => !row.ok)
      .map((row) => `${relative(root, project) || '.'}: ${row.name}: ${row.detail}`),
  )

  for (const patch of inspectPatches(root)) {
    if (!['applied', 'not-declared', 'not-applicable'].includes(patch.state)) {
      issues.push(`${patch.specifier}: ${patchStateDetail(patch.state)}`)
    }
  }

  return { ...data, issues }
}
