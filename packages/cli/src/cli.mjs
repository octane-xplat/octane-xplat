#!/usr/bin/env node
import { binary, subcommands, run } from '@alloc/cmd-ts'
import { dev } from './commands/dev.mjs'
import { build } from './commands/build.mjs'
import { typecheck } from './commands/typecheck.mjs'
import { doctor } from './commands/doctor.mjs'
import { clean } from './commands/clean.mjs'
import { routes } from './commands/routes.mjs'

const cli = subcommands({
	name: 'xplat',
	description: 'One Octane codebase → web + iOS + Android',
	cmds: { dev, build, typecheck, doctor, clean, routes },
})

await run(binary(cli), process.argv)
