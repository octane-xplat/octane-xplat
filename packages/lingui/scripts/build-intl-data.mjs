// Data selection for Lingui's formatting APIs. API initialization belongs to
// src/intl.mobile.ts and runs automatically when the leaf is imported.
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const output = new URL('../dist/', import.meta.url)
const packages = ['intl-pluralrules', 'intl-numberformat', 'intl-datetimeformat', 'intl-listformat']
const locales = new Map()
for (const pkg of packages) {
	const files = await readdir(join(dirname(require.resolve(`@formatjs/${pkg}`)), 'locale-data'))
	locales.set(
		pkg,
		new Set(files.filter((file) => file.endsWith('.js')).map((file) => file.slice(0, -3))),
	)
}
for (const directory of ['locales', 'time-zones']) {
	await rm(new URL(directory, output), { recursive: true, force: true })
	await mkdir(new URL(directory, output), { recursive: true })
}
async function emit(path, imports) {
	// Resolve the platform initializer before registering data. Other targets use
	// the empty initializer; FormatJS data modules leave built-in constructors alone.
	const code =
		["import '../../src/intl'", ...imports.map((path) => `import '${path}'`)].join('\n') + '\n'
	await writeFile(new URL(`${path}.js`, output), code)
	await writeFile(new URL(`${path}.d.ts`, output), 'export {}\n')
}
// Number/date/list data is regional; plural rules may only have the parent tag.
let count = 0
for (const locale of locales.get('intl-numberformat')) {
	const imports = []
	for (const pkg of packages) {
		let tag = locale
		while (tag && !locales.get(pkg).has(tag)) {
			tag = tag.includes('-') ? tag.slice(0, tag.lastIndexOf('-')) : ''
		}
		if (!tag) {
			break
		}
		imports.push(`@formatjs/${pkg}/locale-data/${tag}.js`)
	}
	if (imports.length === packages.length) {
		await emit(`locales/${locale}`, imports)
		count++
	}
}
for (const zones of ['all', 'golden']) {
	await emit(`time-zones/${zones}`, [`@formatjs/intl-datetimeformat/add-${zones}-tz.js`])
}
console.log(`Lingui formatting data entries generated (${count} locales).`)
