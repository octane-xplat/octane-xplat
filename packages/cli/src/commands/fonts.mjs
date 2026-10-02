import {
	command,
	flag,
	option,
	optional,
	restPositionals,
	string,
	subcommands,
} from '@alloc/cmd-ts'

import { resolve } from 'node:path'
import * as p from '@clack/prompts'
import { addFontInputs } from '../fonts.mjs'

const add = command({
	name: 'add',
	description:
		'Register fonts for web (@font-face/@fontsource), iOS, and Android (src/fonts) and wire them onto a --font-* token',
	args: {
		inputs: restPositionals({
			type: string,
			displayName: 'input',
			description:
				'font files (.ttf/.otf/.woff/.woff2) or Fontsource specs (@fontsource/roboto, @fontsource-variable/inter)',
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
		subset: option({
			type: optional(string),
			long: 'subset',
			description: "Fontsource subset (default: 'latin')",
		}),
		weights: option({
			type: optional(string),
			long: 'weights',
			description: "Fontsource static weights to add, e.g. '400,700' (default: all in the subset)",
		}),
		install: flag({
			long: 'install',
			description: 'pnpm add a Fontsource package that is not installed yet',
		}),
	},
	handler: async ({ inputs, dir, name, token, subset, weights, install }) => {
		const appDir = resolve(dir ?? '.')
		p.intro('xplat fonts add')

		const report = await addFontInputs(
			appDir,
			inputs.map((f) => (f.startsWith('@') ? f : resolve(f))),
			{
				name,
				token,
				subset,
				weights: weights?.split(',').map((w) => Number(w.trim())),
				install,
			},
		)

		if (report.error) {
			p.cancel(report.error)
			process.exitCode = 1
			return
		}

		for (const spec of report.installed ?? []) {
			p.log.success(`pnpm add ${spec}`)
		}

		for (const file of report.copied) {
			p.log.success(`src/fonts/${file} — iOS/Android pick this up automatically`)
		}

		for (const face of report.faces) {
			p.log.success(
				face.imported
					? `fonts.css — @import for '${report.names.family}'`
					: `fonts.css — @font-face '${report.names.family}' weight ${face.weight}${face.variable ? ' (variable)' : ''}`,
			)
		}

		for (const file of report.edited.filter((f) => f !== 'fonts.css')) {
			p.log.success(`${file} — updated`)
		}

		for (const warning of report.warnings) {
			p.log.warn(warning)
		}

		const webKind = report.faces.some((f) => f.imported) ? '@import' : '@font-face'
		const names = [
			`web: '${report.names.family}' (${webKind})`,
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
