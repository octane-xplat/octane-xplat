// Changelog page assembly — pure formatting shared by the site bundle
// (changelog.ts) and Node consumers (scripts/build-llms.ts, node --test).
// Erasable TS only: no enums, namespaces, or parameter properties.
//
// The page merges the repo's generated logs — CHANGELOG.md (features and
// breaking changes) and FIXLOG.md (fixes) — into one section per release.
// Every release heading carries an explicit {#anchor} derived from its git
// tag with dots as dashes: v0.19.0 → #v0-19-0, tsrx-typegen-v0.5.0 →
// #tsrx-typegen-v0-5-0. GitHub Releases link these anchors, so they must
// stay stable — derive them from the tag, never the heading text.

const REPO = 'https://github.com/octane-xplat/octane-xplat'

export interface LogSection {
	/** Display label, such as 'Octane Xplat 0.19.0' or 'Unreleased'. */
	title: string
	/** Git tag owning the section ('v0.19.0'); undefined for 'Unreleased'. */
	tag?: string
	date?: string
	url?: string
	body: string
}

export function anchorFor(tag: string): string {
	return tag.replace(/\./g, '-')
}

// Recover the git tag a release section belongs to. Linked headings carry
// the release URL; older unlinked headings carry only a version or label.
function tagFor(label: string, url?: string): string | undefined {
	if (url) {
		return url.split('/').pop()
	}

	const version = label.match(/\d+\.\d+\.\d+/)?.[0]
	if (!version) {
		return undefined // 'Unreleased' and other unversioned sections
	}

	const prefix = label
		.slice(0, label.indexOf(version))
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
	return prefix && !prefix.startsWith('octane') ? `${prefix}-v${version}` : `v${version}`
}

// `## [Label X.Y.Z](release-url) - YYYY-MM-DD`, `## [X.Y.Z] - YYYY-MM-DD`,
// `## [Unreleased]`, and the oldest plain `## X.Y.Z` headings all appear in
// the root logs. Fenced code may contain `## ` lines — track fences.
export function parseLog(md: string): LogSection[] {
	const sections: LogSection[] = []
	let body: string[] = []
	let fence: string | undefined

	const close = () => {
		if (!body.length) {
			return
		}

		const m = /^(?:\[([^\]]+)\]\(([^)\s]+)\)|\[([^\]]+)\]|(\S.*?))(?:\s+-\s+(\d{4}-\d{2}-\d{2}))?\s*$/.exec(
			body[0].slice(3),
		)
		const title = (m?.[1] ?? m?.[3] ?? m?.[4] ?? body[0].slice(3)).trim()
		const url = m?.[2]
		const date = m?.[5]
		sections.push({
			title,
			tag: tagFor(title, url),
			date,
			url,
			body: body.slice(1).join('\n').trim(),
		})
		body = []
	}

	for (const line of md.split('\n')) {
		const delimiter = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1]
		if (fence) {
			if (
				delimiter &&
				delimiter[0] === fence[0] &&
				delimiter.length >= fence.length &&
				line.trim() === delimiter
			) {
				fence = undefined
			}
		} else if (delimiter) {
			fence = delimiter
		} else if (line.startsWith('## ')) {
			close()
		}

		if (body.length || line.startsWith('## ')) {
			body.push(line)
		}
	}

	close()
	return sections.filter((section) => section.body || section.tag || section.date)
}

// Fixlog entries for a release nest under `### Fixes`; their own ### titles
// demote to #### so the version stays the page's only h2 structure.
function demote(body: string): string {
	return body.replace(/^### /gm, '#### ')
}

export function buildChangelogMd(changelog: string, fixlog: string): string {
	const features = parseLog(changelog)
	const fixes = parseLog(fixlog)
	const claimed = new Set<LogSection>()

	const out: string[] = [
		'# Changelog',
		'',
		'> Features, breaking changes, and fixes for every Octane Xplat release, newest first — the same notes the repository keeps in `CHANGELOG.md` and `FIXLOG.md`.',
		'',
		`GitHub Releases link back to the matching version heading here. Older independent \`tsrx-typegen\` releases predate the shared logs; their history lives in the [tsrx-typegen changelog](${REPO}/blob/main/packages/tsrx-typegen/CHANGELOG.md).`,
	]

	const emit = (section: LogSection, fix?: LogSection) => {
		const anchor = anchorFor(section.tag ?? section.title.toLowerCase().replace(/\s+/g, '-'))
		out.push('', `## ${section.title} {#${anchor}}`, '')
		const meta = [section.date, section.url ? `[GitHub release](${section.url})` : '']
			.filter(Boolean)
			.join(' · ')
		if (meta) {
			out.push(`*${meta}*`, '')
		}

		if (section.body) {
			out.push(section.body, '')
		}

		if (fix?.body) {
			claimed.add(fix)
			out.push('### Fixes', '', demote(fix.body), '')
		}
	}

	// Both logs run newest-first; interleave fixlog-only releases by date so a
	// fixes-only version lands in the right spot rather than at the end. Such
	// releases still nest under '### Fixes' — spread keeps the heading/meta
	// while routing the body through the fix slot.
	const extras = fixes.filter((fix) => !features.some((f) => f.tag && f.tag === fix.tag))
	for (const section of features) {
		for (const extra of extras) {
			if (!claimed.has(extra) && extra.date && section.date && extra.date > section.date) {
				emit({ ...extra, body: '' }, extra)
				claimed.add(extra)
			}
		}

		emit(
			section,
			fixes.find((fix) => fix.tag && fix.tag === section.tag),
		)
	}

	for (const extra of extras) {
		if (!claimed.has(extra)) {
			emit({ ...extra, body: '' }, extra)
		}
	}

	return out.join('\n').trimEnd() + '\n'
}
