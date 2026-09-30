#!/usr/bin/env node
import { binary, subcommands, run } from '@alloc/cmd-ts'
import { dev } from './commands/dev.mjs'
import { build } from './commands/build.mjs'
import { typecheck } from './commands/typecheck.mjs'
import { doctor } from './commands/doctor.mjs'
import { clean } from './commands/clean.mjs'
import { routes } from './commands/routes.mjs'
import { patches } from './commands/patches.mjs'

const cli = subcommands({
	name: 'xplat',
	description: 'One Octane codebase → web + iOS + Android + experimental macOS AppKit/WKWebView',
	cmds: { dev, build, typecheck, doctor, clean, routes, patches },
})

await run(binary(cli), process.argv)
