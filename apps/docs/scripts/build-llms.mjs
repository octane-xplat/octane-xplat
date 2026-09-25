// Generate llms.txt + llms-full.txt into dist/ (run after `vite build`).
// Guides are the agent-facing corpus; the design notes stay link-only — an
// agent needs them only when debugging framework internals, not app code.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { NOTES, ORDER, docPath, purposeOf, titleOf } from '../src/doc-meta.ts'

const here = dirname(fileURLToPath(import.meta.url))
const docsDir = join(here, '../../../docs')
const outDir = join(here, '../dist')
const BASE = 'https://octane-xplat.goddardai.org'
const REPO = 'https://github.com/aleclarson/octane-xplat'

// Doc-page links (x.md / ./x.md) resolve to site paths; other relative links
// resolve against the repo on GitHub — same mapping as MdDoc's renderer.
function rewriteLinks(md) {
	return md.replace(/\]\(([^)\s]+)\)/g, (m, href) => {
		if (/^(https?:|#|mailto:)/.test(href)) return m
		const doc = href.replace(/^\.\//, '').match(/^([\w-]+)\.md(#.*)?$/)
		if (doc) return `](${BASE}${docPath(doc[1])}${doc[2] ?? ''})`
		const path = href.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '')
		const kind = path.endsWith('/') || !path.includes('.') ? 'tree' : 'blob'
		return `](${REPO}/${kind}/main/${path})`
	})
}

const docs = []
for (const name of await readdir(docsDir)) {
	if (!name.endsWith('.md')) continue
	const md = await readFile(join(docsDir, name), 'utf8')
	const slug = name.replace(/\.md$/, '')
	docs.push({ slug, title: titleOf(slug, md), purpose: purposeOf(md), guide: !NOTES.has(slug), md })
}
docs.sort((a, b) => {
	const ai = ORDER.indexOf(a.slug)
	const bi = ORDER.indexOf(b.slug)
	return ai !== -1 || bi !== -1 ? (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) : a.slug.localeCompare(b.slug)
})

const HEADER = `# xplat docs

> One Octane codebase, three targets: web via the DOM renderer, iOS and Android via NativeScript (@nativescript-community/octane).

xplat lets one TypeScript app write shared screens from a small component vocabulary. The web build renders them to the DOM; the iOS/Android build renders NativeScript views. Packages: \`@octane-xplat/ui\` (components, styled(), route table, theme), \`@octane-xplat/cli\` (\`xplat\` dev/build/doctor/typecheck/clean), \`@octane-xplat/platform\` (device services), \`create-octane-xplat\` (project starter).

Rules for shared app code: one element vocabulary per file — platform divergence happens at file boundaries via \`.web\`/\`.native\`/\`.ios\`/\`.android\` filename suffixes, not inside JSX. Static styles go in \`className\`; values that change at runtime go in \`style\` objects. Shared code never touches DOM globals — device capabilities come from \`@octane-xplat/platform\`. Hook-calling code lives in \`.tsx\`/\`.tsrx\` files. Every app bundles exactly one copy of \`octane\`.
`

const guideLinks = docs
	.filter((d) => d.guide)
	.map((d) => `- [${d.title}](${BASE}${docPath(d.slug)})${d.purpose ? `: ${d.purpose}` : ''}`)
	.join('\n')

const llms = `${HEADER}
## Guides

${guideLinks}

## Optional

- [All guides, one file](${BASE}/llms-full.txt): every guide inlined in reading order.
- [Design notes](${BASE}/notes/status): the design record — status, decisions, open questions, per-topic implementation notes. Consult when debugging framework internals or checking why a constraint exists; not needed for app work.
- [Changelog](${REPO}/blob/main/CHANGELOG.md): per-release changes and upgrading notes.
- [Repository](${REPO})
- [npm: @octane-xplat/ui](https://www.npmjs.com/package/@octane-xplat/ui)
`

const body = docs
	.filter((d) => d.guide)
	.map((d) => rewriteLinks(d.md).trim())
	.join('\n\n---\n\n')

const full = `${HEADER}
The complete guides follow in reading order, separated by --- lines. The design notes are intentionally excluded — an agent needs them only when debugging the framework itself; they are at ${BASE}/notes/status when required.

---

${body}
`

await mkdir(outDir, { recursive: true })
await writeFile(join(outDir, 'llms.txt'), llms)
await writeFile(join(outDir, 'llms-full.txt'), full)
console.log(`llms.txt + llms-full.txt → ${outDir} (${docs.filter((d) => d.guide).length} guides, ${docs.filter((d) => !d.guide).length} notes linked only)`)
