// Publish explicit side-effect entries. Consumers choose APIs and locale data
// through static imports; no runtime glob, CDN, or app-owned FormatJS dependency.
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const out = new URL('../dist/polyfills/', import.meta.url)
const entries = {
	locale: { package: 'intl-locale', prerequisites: [] },
	plural: { package: 'intl-pluralrules', prerequisites: ['locale'] },
	number: { package: 'intl-numberformat', prerequisites: ['plural'] },
	date: { package: 'intl-datetimeformat', prerequisites: ['number'] },
	'relative-time': { package: 'intl-relativetimeformat', prerequisites: ['number'] },
	list: { package: 'intl-listformat', prerequisites: ['locale'] },
	collator: { package: 'intl-collator', prerequisites: ['locale'] },
	segmenter: { package: 'intl-segmenter', prerequisites: ['locale'] },
}
const formatting = ['locale', 'plural', 'number', 'date', 'relative-time', 'list']
const imports = (paths) => paths.map((path) => `import '${path}'`).join('\n') + '\n'

async function emit(path, code, description) {
	const file = new URL(`${path}.js`, out)
	await mkdir(new URL('.', file), { recursive: true })
	await writeFile(file, `// ${description}\n${code}`)
	await writeFile(new URL(`${path}.d.ts`, out), `/** ${description} */\nexport {}\n`)
}

await rm(out, { recursive: true, force: true })
await emit(
	'canonical',
	imports(['@formatjs/intl-getcanonicallocales/polyfill.js']),
	'Install guarded locale canonicalization.',
)
const locales = {}
for (const [name, entry] of Object.entries(entries)) {
	const pkg = `@formatjs/${entry.package}`
	const root = dirname(require.resolve(pkg))
	let files = []
	try {
		files = (await readdir(join(root, 'locale-data'))).filter((file) => file.endsWith('.js'))
	} catch (error) {
		if (error.code !== 'ENOENT') {
			throw error
		}
	}
	locales[name] = new Set(files.map((file) => file.slice(0, -3)))
	const paths = [
		'./canonical.js',
		...entry.prerequisites.map((dep) => `./${dep}.js`),
		`${pkg}/polyfill.js`,
	]
	if (locales[name].has('en')) {
		paths.push(`${pkg}/locale-data/en.js`)
	}
	await emit(
		name,
		imports(paths),
		`Install guarded ${name} support, with English data where required.`,
	)
}

// Each per-API locale entry includes the same locale for prerequisites when
// supplied upstream, so e.g. German compact numbers use German plural rules.
for (const name of Object.keys(entries)) {
	for (const locale of locales[name]) {
		const dependencies = new Set()
		function visit(api) {
			for (const dep of entries[api].prerequisites) {
				visit(dep)
			}
			let dataLocale = locale
			while (dataLocale && !locales[api].has(dataLocale)) {
				dataLocale = dataLocale.includes('-')
					? dataLocale.slice(0, dataLocale.lastIndexOf('-'))
					: ''
			}
			if (dataLocale) {
				dependencies.add(`@formatjs/${entries[api].package}/locale-data/${dataLocale}.js`)
			}
		}
		visit(name)
		await emit(
			`${name}/locales/${locale}`,
			imports([`../../${name}.js`, ...dependencies]),
			`Install ${name} support and ${locale} locale data.`,
		)
	}
}

await emit(
	'index',
	imports(formatting.map((name) => `./${name}.js`)),
	'Opt in to guarded Intl formatting with English data; excludes Collator and Segmenter.',
)
const common = [...locales.number].filter((locale) =>
	formatting.every((name) => !locales[name].size || locales[name].has(locale)),
)
for (const locale of common) {
	await emit(
		`locales/${locale}`,
		imports([
			'../index.js',
			...formatting
				.filter((name) => locales[name].size)
				.map((name) => `../${name}/locales/${locale}.js`),
		]),
		`Install guarded Intl formatting and ${locale} locale data.`,
	)
}
for (const zones of ['golden', 'all']) {
	await emit(
		`time-zones/${zones}`,
		imports(['../date.js', `@formatjs/intl-datetimeformat/add-${zones}-tz.js`]),
		`Load ${zones} time-zone data for the DateTimeFormat polyfill; default zone remains UTC.`,
	)
}
console.log(`Intl entries generated (${common.length} shared formatting locales).`)
