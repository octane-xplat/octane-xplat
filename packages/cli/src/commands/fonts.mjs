import { command, option, optional, restPositionals, string, subcommands } from '@alloc/cmd-ts'
import { resolve } from 'node:path'
import * as p from '@clack/prompts'
import { addFont } from '../fonts.mjs'

const add = command({
	name: 'add',
	description:
		'Register a .ttf/.otf font for web (@font-face), iOS, and Android (src/fonts) and wire it onto a --font-* token',
	args: {
		files: restPositionals({
			type: string,
			displayName: 'file',
			description: 'font files — one variable file or several static weights of one family',
		}),
		dir: option({
			type: optional(string),
			long: 'dir',
			description: 'app root (default: cwd)',
		}),
		name: option({
			type: optional(string),
			long: 'name',
			description: 'CSS family name (default: the family name inside the font file)',
		}),
		token: option({
			type: optional(string),
			long: 'token',
			description:
				"--font-* token to wire in style.css: 'sans' (default), 'mono', a custom name, or 'none'",
		}),
		weight: option({
			type: optional(string),
			long: 'weight',
			description:
				"@font-face font-weight override, e.g. '700' or '100 900' (default: fvar wght range or OS/2 weight class)",
		}),
	},
	handler: async ({ files, dir, name, token, weight }) => {
		const appDir = resolve(dir ?? '.')
		p.intro('xplat fonts add')

		const report = addFont(
			appDir,
			files.map((f) => resolve(f)),
			{ name, token, weight },
		)

		if (report.error) {
			p.cancel(report.error)
			process.exitCode = 1
			return
		}

		for (const file of report.copied) {
			p.log.success(`src/fonts/${file} — iOS/Android pick this up automatically`)
		}

		for (const face of report.faces) {
			p.log.success(
				`fonts.css — @font-face '${report.names.family}' weight ${face.weight}${face.variable ? ' (variable)' : ''}`,
			)
		}

		for (const file of report.edited.filter((f) => f !== 'fonts.css')) {
			p.log.success(`${file} — updated`)
		}

		for (const warning of report.warnings) {
			p.log.warn(warning)
		}

		const names = [
			`web: '${report.names.family}' (@font-face)`,
			report.names.ios.length
				? `iOS: ${report.names.ios.map((n) => `'${n}'`).join(', ')} (internal/PostScript)`
				: null,
			`android: ${report.names.android.map((n) => `'${n}'`).join(', ')} (filename)`,
		].filter(Boolean)

		p.note(names.join('\n'), 'registered family names')
		p.outro('custom font is live — swap the file and rerun to change it')
	},
})

export const fonts = subcommands({
	name: 'fonts',
	description: 'Register custom fonts across web and NativeScript targets',
	cmds: { add },
})
