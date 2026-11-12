#!/usr/bin/env node
// Repo route generation without the Go CLI binary. `xplat routes` orchestrates
// this same planRoutes call with CLI-facing validation (input fingerprints,
// output-alias guards, atomic publish); a fixed internal codegen call needs
// none of that, and requiring the native build would make `bun install`
// depend on a Go toolchain unrelated to most workspaces.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from 'node:fs'

import { dirname } from 'node:path'
import { planRoutes } from '../packages/cli/src/route-generator.ts'

const args = process.argv.slice(2)
const flag = (name: string): string | undefined => {
  const index = args.indexOf(name)

  return index >= 0 ? args[index + 1] : undefined
}

const { count, outputs } = await planRoutes(process.cwd(), flag('--dir'), flag('--out'), {
  bake: true,
  onWarn: (message: string) => console.error('Warning:', message),
})

if (count === false) {
  console.error(
    'No route dir found — expected ./app, ./src/app, or xplat.routes.json (or pass --dir)',
  )

  process.exit(1)
}

for (const [file, source] of outputs as Map<string, string>) {
  if (existsSync(file) && readFileSync(file, 'utf8') === source) {
    continue
  }

  mkdirSync(dirname(file), { recursive: true })

  // Preserve an existing output symlink and rename complete files so a
  // concurrent compiler never reads a truncated declaration.
  const target = existsSync(file) ? realpathSync(file) : file
  const temporary = `${target}.tmp-${process.pid}`

  writeFileSync(temporary, source)
  renameSync(temporary, target)
}

console.log(
  `Generated route contracts and platform catalogs — ${count} route${count === 1 ? '' : 's'}`,
)
