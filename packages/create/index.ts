#!/usr/bin/env node
import { existsSync, readdirSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { parseArgs } from 'node:util'
import {
  composeLibrary,
  composeTargets,
  defaultTargets,
  resolveTargets,
  selectableTargets,
  targets,
} from './scaffold.ts'

import { compatibility } from './compatibility.ts'
import {
  decidePackageManager,
  installedManagers,
  managerVersion,
  type PackageManager,
} from './package-manager.ts'

const fail = (message: string): never => {
  console.error(`✗ ${message}`)
  process.exit(1)
}

function parseCli() {
  try {
    return parseArgs({
      args: process.argv.slice(2),
      allowPositionals: true,
      options: {
        template: { type: 'string', default: 'app' },
        name: { type: 'string' },
        targets: { type: 'string' },
        'package-manager': { type: 'string' },
        'no-install': { type: 'boolean', default: false },
      },
    })
  } catch (error) {
    return fail(error.message)
  }
}

const { values, positionals } = parseCli()

const oneOf = <T extends string>(flag: string, value: string | undefined, choices: readonly T[]) =>
  value === undefined || (choices as readonly string[]).includes(value)
    ? (value as T | undefined)
    : fail(`--${flag} must be ${choices.join(' or ')}`)

const templateArg = oneOf('template', values.template, ['app', 'library'] as const)!
const managerFlag = oneOf('package-manager', values['package-manager'], ['bun', 'pnpm'] as const)
const noInstall = values['no-install']

if (values.name === '') {
  fail('--name needs an npm package name')
}

if (positionals.length > 1) {
  fail(`expected one project directory, got ${positionals.join(' ')}`)
}

const defaultDir = templateArg === 'library' ? 'octane-xplat-library' : 'octane-xplat-app'
const dir = resolve(positionals[0] ?? defaultDir)

if (templateArg === 'library' && values.targets !== undefined) {
  fail('--targets applies to the app template; libraries start with web and native builds')
}

if (templateArg === 'app' && values.name !== undefined) {
  fail('--name applies only to the library template')
}

if (existsSync(dir) && readdirSync(dir).length > 0) {
  fail(`${dir} exists and is not empty`)
}

const parseTargets = (value) => {
  const ids = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (ids.length === 0) {
    throw new Error(`--targets needs a comma list: ${selectableTargets.join(', ')}`)
  }

  for (const id of ids) {
    if (!selectableTargets.includes(id)) {
      throw new Error(
        `unknown target "${id}" — expected a comma list of: ${selectableTargets.join(', ')}`,
      )
    }
  }

  return resolveTargets(ids)
}

const decision = decidePackageManager({
  flag: managerFlag,
  userAgent: process.env.npm_config_user_agent,
  installed: installedManagers(),
  interactive: Boolean(process.stdout.isTTY),
})

let packageManager: PackageManager = decision.kind === 'use' ? decision.manager : 'bun'
let managerNotice: string | undefined

if (decision.kind === 'missing') {
  managerNotice = `! Neither Bun nor pnpm was found. Installing dependencies, applying framework
  patches (xplat patches apply) and running the app all need one of them.
  Install Bun ${compatibility.tools.bun}+ (https://bun.sh) or pnpm ${compatibility.tools.pnpm}+ (https://pnpm.io), then:
    cd ${dir} && bun install
  To use pnpm instead, recreate the project with --package-manager pnpm.`
} else if (decision.kind === 'use' && !decision.installed.includes(decision.manager)) {
  managerNotice = `! ${managerLabel(decision.manager)} was selected but is not installed — the
  ${decision.manager} project was scaffolded without installing dependencies.
  Install ${managerLabel(decision.manager)} ${compatibility.tools[decision.manager]}+, then run the
  package manager's install command inside ${dir}.`
}

/** The manager `select`, joining the caller's clack session. */
async function promptForManager(p: typeof import('@clack/prompts')) {
  const picked = await p.select<PackageManager>({
    message: 'Package manager',
    options: [
      { value: 'bun', label: 'Bun' },
      { value: 'pnpm', label: 'pnpm' },
    ],
    initialValue: 'bun',
  })

  if (p.isCancel(picked)) {
    p.cancel('Cancelled')
    process.exit(0)
  }

  packageManager = picked
}

let ids: string[] = []

if (templateArg === 'library') {
  const packageName = values.name ?? basename(dir)

  if (decision.kind === 'prompt') {
    const p = await import('@clack/prompts')

    p.intro('create-octane-xplat')
    await promptForManager(p)
  }

  try {
    composeLibrary(dir, packageName, { packageManager })
  } catch (error) {
    console.error(`✗ ${error.message}`)
    process.exit(1)
  }

  console.log(
    `\n✓ scaffolded ${dir} (library: ${packageName}; web + iOS + Android; ${packageManager})`,
  )
} else {
  if (values.targets !== undefined) {
    try {
      ids = parseTargets(values.targets)
    } catch (error) {
      console.error(`✗ ${error.message}`)
      process.exit(1)
    }
  } else if (process.stdout.isTTY) {
    // Non-interactive creation does not need the prompt module.
    const p = await import('@clack/prompts')

    p.intro('create-octane-xplat')

    const picked = await p.multiselect({
      message: 'Target platforms',
      options: selectableTargets.map((id) => ({
        value: id,
        label: targets[id].label,
        hint: targets[id].note,
      })),
      initialValues: [...defaultTargets],
      required: true,
    })

    if (p.isCancel(picked)) {
      p.cancel('Cancelled')
      process.exit(0)
    }

    ids = picked
    if (decision.kind === 'prompt') {
      await promptForManager(p)
    }
  } else {
    ids = defaultTargets
  }

  // Targets from the flag skip the multiselect; the manager choice still asks.
  if (decision.kind === 'prompt' && values.targets !== undefined) {
    const p = await import('@clack/prompts')

    p.intro('create-octane-xplat')
    await promptForManager(p)
  }

  composeTargets(ids, dir, { packageManager })
  console.log(
    `\n✓ scaffolded ${dir} (${[...new Set(resolveTargets(ids))].filter((id) => !targets[id].hidden).join(', ')}; ${packageManager})`,
  )
}

if (managerNotice) {
  console.log(`\n${managerNotice}`)
  if (decision.kind === 'use') {
    printNextSteps(dir, ids, templateArg, packageManager)
  }

  process.exit(0)
}

if (noInstall) {
  console.log('\nSkipped install (--no-install). To run manually:')
  printNextSteps(dir, ids, templateArg, packageManager)
  process.exit(0)
}

const managerFloor = compatibility.tools[packageManager]
const managerInstalled = managerVersion(packageManager)

if (managerInstalled !== undefined && versionBelow(managerInstalled, managerFloor)) {
  console.log(
    `! ${managerLabel(packageManager)} ${managerInstalled} is below the supported ${managerFloor}+ — install may fail`,
  )
}

const install = spawnSync(packageManager, ['install'], {
  cwd: dir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if (install.status !== 0) {
  console.log(
    `\nInstall didn't finish (${managerLabel(packageManager)} missing?). To run manually:`,
  )

  printNextSteps(dir, ids, templateArg, packageManager)
  process.exit(install.status ?? 1)
}

if (templateArg === 'app' && ids.includes('web')) {
  console.log('\n✓ installed — starting dev server (Ctrl+C to stop)\n')
  spawnSync(packageManager, ['run', 'dev'], {
    cwd: dir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
} else {
  console.log('\n✓ installed. Next steps:')
  printNextSteps(dir, ids, templateArg, packageManager)
}

function managerLabel(manager: PackageManager) {
  return manager === 'bun' ? 'Bun' : 'pnpm'
}

function versionBelow(version: string, floor: string) {
  const parts = (value: string) => value.split('.').map((n) => Number.parseInt(n, 10) || 0)
  const got = parts(version)
  const min = parts(floor)

  for (let i = 0; i < Math.max(got.length, min.length); i++) {
    const a = got[i] ?? 0
    const b = min[i] ?? 0

    if (a !== b) {
      return a < b
    }
  }

  return false
}

function printNextSteps(dir, ids, template, pm: PackageManager) {
  console.log(`  cd ${dir}\n  ${pm} install`)
  if (template === 'library') {
    console.log(
      `  ${pm} run typecheck\n  ${pm} run lint\n  ${pm} run typegen\n  ${pm} run test\n  ${pm} run test:packed`,
    )

    return
  }

  if (ids.includes('web')) {
    console.log(`  ${pm} run dev`)
  } else {
    // No web entry — `xplat dev` discovers whichever native targets exist.
    console.log(`  ${pm} run xplat dev`)
  }
}
