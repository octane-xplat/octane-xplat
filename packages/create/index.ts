#!/usr/bin/env node
import { existsSync, readdirSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
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

const argv = process.argv.slice(2)
const noInstall = argv.includes('--no-install')
const templateIndex = argv.findIndex((arg) => arg === '--template' || arg.startsWith('--template='))
const templateValueIndex =
  templateIndex !== -1 && argv[templateIndex] === '--template' ? templateIndex + 1 : -1

const templateArg =
  templateIndex === -1
    ? 'app'
    : templateValueIndex !== -1
      ? argv[templateValueIndex]
      : argv[templateIndex].slice('--template='.length)

const nameIndex = argv.findIndex((arg) => arg === '--name' || arg.startsWith('--name='))
const nameValueIndex = nameIndex !== -1 && argv[nameIndex] === '--name' ? nameIndex + 1 : -1
const nameArg =
  nameIndex === -1
    ? undefined
    : nameValueIndex !== -1
      ? argv[nameValueIndex]
      : argv[nameIndex].slice('--name='.length)

if (templateIndex !== -1 && (!templateArg || templateArg.startsWith('-'))) {
  console.error('✗ --template needs a value: app or library')
  process.exit(1)
}

if (!['app', 'library'].includes(templateArg)) {
  console.error(`✗ unknown template "${templateArg}" — expected app or library`)
  process.exit(1)
}

if (nameIndex !== -1 && (!nameArg || nameArg.startsWith('-'))) {
  console.error('✗ --name needs an npm package name')
  process.exit(1)
}

const targetsIndex = argv.findIndex((arg) => arg === '--targets' || arg.startsWith('--targets='))
const targetsValueIndex =
  targetsIndex !== -1 && argv[targetsIndex] === '--targets' ? targetsIndex + 1 : -1

const targetsArg =
  targetsIndex === -1
    ? undefined
    : targetsValueIndex !== -1
      ? argv[targetsValueIndex]
      : argv[targetsIndex].slice('--targets='.length)

if (targetsIndex !== -1 && (targetsArg === undefined || targetsArg.startsWith('-'))) {
  console.error(`✗ --targets needs a comma list: ${selectableTargets.join(', ')}`)
  process.exit(1)
}

const managerIndex = argv.findIndex(
  (arg) => arg === '--package-manager' || arg.startsWith('--package-manager='),
)
const managerValueIndex =
  managerIndex !== -1 && argv[managerIndex] === '--package-manager' ? managerIndex + 1 : -1

const managerArg =
  managerIndex === -1
    ? undefined
    : managerValueIndex !== -1
      ? argv[managerValueIndex]
      : argv[managerIndex].slice('--package-manager='.length)

if (managerIndex !== -1 && (!managerArg || managerArg.startsWith('-'))) {
  console.error('✗ --package-manager needs a value: bun or pnpm')
  process.exit(1)
}

if (managerArg !== undefined && managerArg !== 'bun' && managerArg !== 'pnpm') {
  console.error('✗ --package-manager must be bun or pnpm')
  process.exit(1)
}

const optionValues = new Set(
  [targetsValueIndex, templateValueIndex, nameValueIndex, managerValueIndex].filter(
    (index) => index !== -1,
  ),
)

const positional = argv.filter((arg, i) => !arg.startsWith('-') && !optionValues.has(i))
const defaultDir = templateArg === 'library' ? 'octane-xplat-library' : 'octane-xplat-app'
const dir = resolve(positional[0] ?? defaultDir)

if (templateArg === 'library' && targetsIndex !== -1) {
  console.error(
    '✗ --targets applies to the app template; libraries start with web and native builds',
  )

  process.exit(1)
}

if (templateArg === 'app' && nameIndex !== -1) {
  console.error('✗ --name applies only to the library template')
  process.exit(1)
}

if (existsSync(dir) && readdirSync(dir).length > 0) {
  console.error(`✗ ${dir} exists and is not empty`)
  process.exit(1)
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
  flag: managerArg,
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
  const packageName = nameArg ?? basename(dir)
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
  if (targetsArg !== undefined) {
    try {
      ids = parseTargets(targetsArg)
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
  if (decision.kind === 'prompt' && targetsArg !== undefined) {
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
  console.log(`\nInstall didn't finish (${managerLabel(packageManager)} missing?). To run manually:`)
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
