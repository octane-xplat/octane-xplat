// Verified package → release-tag mapping (plans/octane-xplat-mcp.md:
// "the project's verified package-to-release mapping"). The release workflow
// tags one `vX.Y.Z` for the whole lockstep set; tsrx-typegen rides its own
// `tsrx-typegen-v*` track (cliff.tsrx-typegen.toml). Scoped package names map
// to packages/<suffix> by repo convention — verified by
// scripts/publishable.ts. Unscoped names need an explicit entry; an unknown
// name gets no mapping and an explicit unavailable result, never a guess.

export const RELEASE_REPO = 'https://github.com/octane-xplat/octane-xplat'

const lockstepTag = (version) => `v${version}`

const EXPLICIT = {
	'tsrx-typegen': { dir: 'packages/tsrx-typegen', tag: (v) => `tsrx-typegen-v${v}` },
	'create-octane-xplat': { dir: 'packages/create', tag: lockstepTag },
}

/**
 * @returns {{ repo: string, dir: string, tag: string } | null}
 */
export function releaseMapping(packageName, version, repo = RELEASE_REPO) {
	const entry =
		EXPLICIT[packageName] ??
		(packageName.startsWith('@octane-xplat/')
			? { dir: `packages/${packageName.slice('@octane-xplat/'.length)}`, tag: lockstepTag }
			: null)

	if (!entry) {
		return null
	}

	return { repo, dir: entry.dir, tag: entry.tag(version) }
}
