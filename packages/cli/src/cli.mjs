#!/usr/bin/env node
import { binary, subcommands, run } from '@alloc/cmd-ts'
import { add } from './commands/add.mjs'
import { dev } from './commands/dev.mjs'
import { build } from './commands/build.mjs'
import { typecheck } from './commands/typecheck.mjs'
import { doctor } from './commands/doctor.mjs'
import { clean } from './commands/clean.mjs'
import { routes } from './commands/routes.mjs'
import { patches } from './commands/patches.mjs'
import { fonts } from './commands/fonts.mjs'
import { updates } from './commands/updates.mjs'

const cli = subcommands({
	name: 'xplat',
	description: 'One Octane codebase → web + iOS + Android + experimental macOS AppKit/WKWebView',
	cmds: { add, dev, build, typecheck, doctor, clean, routes, patches, fonts, updates },
})

await run(binary(cli), process.argv)
