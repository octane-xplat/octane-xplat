// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Generate llms.txt + llms-full.txt into dist/ (run after `vite build`).
// Only reader-facing docs/ content is exported. Internal records stay in the
// repository's .agents/ documentation tree.
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
import { buildChangelogMd } from '../src/changelog-format.ts'

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
			return `](${BASE}${docPath(slug)}${hash})`
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
		md,
		dir: dir === '.' ? '' : dir,
	})
}

// The changelog page is generated from the repo's root logs — the same
// document the site renders (see src/changelog.ts).
const changelogMd = buildChangelogMd(
	await readFile(join(here, '../../../CHANGELOG.md'), 'utf8'),
	await readFile(join(here, '../../../FIXLOG.md'), 'utf8'),
)
docs.push({
	slug: 'changelog',
	title: titleOf('changelog', changelogMd),
	purpose: purposeOf(changelogMd),
	md: changelogMd,
	dir: 'releases',
})

docs.sort((a, b) => {
	const d = rankOf(a.slug, a.dir) - rankOf(b.slug, b.dir)
	return d || a.slug.localeCompare(b.slug)
})

const slugs = new Set(docs.map((d) => d.slug))

const HEADER = `# Xplat docs

> Build shared TypeScript screens for web, iOS, and Android. macOS, Windows, and Linux are experimental targets with separate setup and narrower verification; consult the target guide before choosing a release platform.

Xplat lets one TypeScript app write shared screens from a small component vocabulary. The web build renders them to the DOM; the iOS/Android build renders NativeScript views. Packages: \`@octane-xplat/ui\` (components, styled(), route table, theme), \`@octane-xplat/cli\` (\`xplat\` dev/build/doctor/typecheck/clean), \`@octane-xplat/platform\` (device services), \`create-octane-xplat\` (project starter).

Rules for shared app code: one element vocabulary per file — platform divergence happens at file boundaries using \`.web\` for browser code, \`.mobile\` for shared iOS/Android variants, and OS suffixes such as \`.ios\`/\`.android\`; the unsuffixed module is the native default. Static styles go in \`className\`; values that change at runtime go in \`style\` objects. Shared code never touches DOM globals — device capabilities come from \`@octane-xplat/platform\`. Hook-calling code lives in \`.tsx\`/\`.tsrx\` files. Every app bundles exactly one copy of \`octane\`.

\`\`\`tsx
import { useState } from 'octane'
import { View, Text, Pressable } from '@octane-xplat/ui'

export function Counter() {
  const [count, setCount] = useState(0)
  return <View className="counter" style={{ opacity: count === 0 ? 0.6 : 1 }}>
    <Text>{count} items packed</Text>
    <Pressable onPress={() => setCount(count + 1)}><Text>Pack an item</Text></Pressable>
  </View>
}
\`\`\`
`

const link = (d) => `- [${d.title}](${BASE}${docPath(d.slug)})${d.purpose ? `: ${d.purpose}` : ''}`

const guideLinks = GROUPS.map(
	(g) =>
		`### ${g.label}\n\n` +
		docs
			.filter((d) => (d.dir || 'start') === g.dir)
			.map(link)
			.join('\n'),
).join('\n\n')

const llms = `${HEADER}
## Guides

${guideLinks}

## Optional

- [All guides, one file](${BASE}/llms-full.txt): every guide inlined in reading order.
- [Design records](${REPO}/tree/main/.agents/design): decisions, proposals, research, and open questions for framework contributors.
- [Implementation documentation](${REPO}/tree/main/.agents/docs): contributor guidance, implementation notes, recipes, parity records, and platform investigations.
- [Repository](${REPO})
- [npm: @octane-xplat/ui](https://www.npmjs.com/package/@octane-xplat/ui)
`

// llms-full stays focused on the app-building guides; the changelog is a
// reference page (it would dominate the file), so llms.txt only links it.
const body = docs
	.filter((d) => d.dir !== 'releases')
	.map((d) => rewriteLinks(d.md, d.dir, slugs).trim())
	.join('\n\n---\n\n')

const full = `${HEADER}
The complete app-building guides follow in reading order, separated by --- lines. Framework implementation notes and design records are maintained in the repository under .agents/ and are not part of this corpus.

---

${body}
`

await mkdir(outDir, { recursive: true })
await writeFile(join(outDir, 'llms.txt'), llms)
await writeFile(join(outDir, 'llms-full.txt'), full)
console.log(`llms.txt + llms-full.txt → ${outDir} (${docs.length} guides)`)
