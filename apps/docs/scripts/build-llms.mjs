// Generate llms.txt + llms-full.txt into dist/ (run after `vite build`).
// Guides are the agent-facing corpus; the design notes stay link-only — an
// agent needs them only when debugging framework internals, not app code.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
	GROUPS,
	docPath,
	docSlugFor,
	purposeOf,
	rankOf,
	repoPathFor,
	slugFor,
	titleOf,
} from '../src/doc-meta.ts'

const here = dirname(fileURLToPath(import.meta.url))
const docsDir = join(here, '../../../docs')
const outDir = join(here, '../dist')
const BASE = 'https://octane-xplat.goddardai.org'
const REPO = 'https://github.com/octane-xplat/octane-xplat'

// Doc-page links resolve to site paths by slug; other relative links resolve
// against the repo on GitHub — same mapping as MdDoc's renderer.
function rewriteLinks(md, dir, slugs) {
	return md.replace(/\]\(([^)\s]+)\)/g, (m, href) => {
		if (/^(https?:|#|mailto:)/.test(href)) {
			return m
		}

		const slug = docSlugFor(href, dir)
		if (slug && slugs.has(slug)) {
			const hash = href.includes('#') ? href.slice(href.indexOf('#')) : ''
			return `](${BASE}${docPath(slug, slugs.get(slug))}${hash})`
		}

		const path = repoPathFor(href, dir)
		const kind = path.endsWith('/') || !path.includes('.') ? 'tree' : 'blob'
		const hash = href.includes('#') ? href.slice(href.indexOf('#')) : ''
		return `](${REPO}/${kind}/main/${path}${hash})`
	})
}

async function* walk(dir) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name)
		if (entry.isDirectory() && entry.name !== 'evidence') {
			yield* walk(path)
		} else if (entry.name.endsWith('.md')) {
			yield path
		}
	}
}

const docs = []
for await (const path of walk(docsDir)) {
	const rel = relative(docsDir, path).replace(/\.md$/, '')
	const dir = dirname(rel)
	const md = await readFile(path, 'utf8')
	const slug = slugFor(dir === '.' ? '' : dir, rel.split('/').pop())
	docs.push({
		slug,
		title: titleOf(slug, md),
		purpose: purposeOf(md),
		guide: dir !== 'notes',
		md,
		dir: dir === '.' ? '' : dir,
	})
}

docs.sort((a, b) => {
	if (a.guide !== b.guide) {
		return a.guide ? -1 : 1
	}

	const d = rankOf(a.slug, a.dir) - rankOf(b.slug, b.dir)
	return d || a.slug.localeCompare(b.slug)
})

const slugs = new Map(docs.map((d) => [d.slug, d.guide ? 'guides' : 'notes']))

const HEADER = `# Xplat docs

> Build shared TypeScript screens for web, iOS, and Android. macOS, Windows, and Linux are experimental targets with separate setup and narrower verification; consult the target guide before choosing a release platform.

Xplat lets one TypeScript app write shared screens from a small component vocabulary. The web build renders them to the DOM; the iOS/Android build renders NativeScript views. Packages: \`@octane-xplat/ui\` (components, styled(), route table, theme), \`@octane-xplat/cli\` (\`xplat\` dev/build/doctor/typecheck/clean), \`@octane-xplat/platform\` (device services), \`create-octane-xplat\` (project starter).

Rules for shared app code: one element vocabulary per file — platform divergence happens at file boundaries using \`.web\` for browser code, \`.mobile\` for shared iOS/Android variants, and OS suffixes such as \`.ios\`/\`.android\`; the unsuffixed module is the native default. Static styles go in \`className\`; values that change at runtime go in \`style\` objects. Shared code never touches DOM globals — device capabilities come from \`@octane-xplat/platform\`. Hook-calling code lives in \`.tsx\`/\`.tsrx\` files. Every app bundles exactly one copy of \`octane\`.
`

const link = (d) =>
	`- [${d.title}](${BASE}${docPath(d.slug, 'guides')})${d.purpose ? `: ${d.purpose}` : ''}`

const guideLinks = GROUPS.map(
	(g) =>
		`### ${g.label}\n\n` +
		docs
			.filter((d) => d.guide && (d.dir || 'start') === g.dir)
			.map(link)
			.join('\n'),
).join('\n\n')

const llms = `${HEADER}
## Guides

${guideLinks}

## Optional

- [All guides, one file](${BASE}/llms-full.txt): every guide inlined in reading order.
- [Design notes](${BASE}/notes): the design record — status, decisions, open questions, per-topic implementation notes. Consult when debugging framework internals or checking why a constraint exists; not needed for app work.
- [Changelog](${REPO}/blob/main/CHANGELOG.md): per-release changes and upgrading notes.
- [Repository](${REPO})
- [npm: @octane-xplat/ui](https://www.npmjs.com/package/@octane-xplat/ui)
`

const body = docs
	.filter((d) => d.guide)
	.map((d) => rewriteLinks(d.md, d.dir, slugs).trim())
	.join('\n\n---\n\n')

const full = `${HEADER}
The complete guides follow in reading order, separated by --- lines. The design notes are intentionally excluded — an agent needs them only when debugging the framework itself; they are at ${BASE}/notes when required.

---

${body}
`

await mkdir(outDir, { recursive: true })
await writeFile(join(outDir, 'llms.txt'), llms)
await writeFile(join(outDir, 'llms-full.txt'), full)
console.log(
	`llms.txt + llms-full.txt → ${outDir} (${docs.filter((d) => d.guide).length} guides, ${docs.filter((d) => !d.guide).length} notes linked only)`,
)
