// The changelog page is generated, not authored in docs/: the site's build
// inlines the repo's root logs (?raw) and changelog-format merges them into
// one section per release with tag-derived {#anchors} — the same anchors
// GitHub Releases link to.
import changelogMd from '../../../CHANGELOG.md?raw'
import fixlogMd from '../../../FIXLOG.md?raw'
import { buildChangelogMd } from './changelog-format'
import type { DocPage } from './docs'

export const CHANGELOG_DOC: DocPage = {
	slug: 'changelog',
	id: 'changelog',
	title: 'Changelog',
	md: buildChangelogMd(changelogMd, fixlogMd),
	dir: 'releases',
	section: 'releases',
}
