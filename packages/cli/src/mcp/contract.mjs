// Capability/identity/provenance contract — plans/octane-xplat-mcp.md.
//
// Package A owns this contract surface; it is being implemented in parallel.
// Until A's canonical module lands, package B (documentation retrieval)
// constructs and consumes these shapes locally so the final wiring is a
// module swap, not a semantic merge. Everything B reports to an agent carries
// these fields; do not add a parallel identity model.

// Where a piece of served content came from.
export const SOURCES = Object.freeze({
	RELEASE_DOCS: 'release-docs', // exact-tag snapshot of a published release
	DEVELOPMENT_DOCS: 'development-docs', // linked/workspace checkout, no release version
	INSTALLED_SOURCE: 'installed-source', // fallback pointer into node_modules
	PROJECT_GUIDANCE: 'project-guidance', // consumer-workspace guidance, scoped
	APP_SOURCE: 'app-source', // the bound application's current working tree
	FRAMEWORK_SOURCE: 'framework-source', // installed/linked package source
})

// Version match status for a served result (design: "exact, verified
// compatible, mismatched, or unavailable").
export const MATCH = Object.freeze({
	EXACT: 'exact', // served snapshot is the installed version's validated tag
	COMPATIBLE: 'verified-compatible', // shared guide verified for the bound set
	OUTSIDE_BINDING: 'outside-installed-binding', // explicit comparison/migration request
	UNAVAILABLE: 'unavailable',
	CONFLICT: 'tag-conflict', // remote tag moved; cached binding held, needs resolution
})

/** Project identity the docs provider binds to (A's project-context shape). */
export function projectIdentity({ workspaceRoot, packages, fingerprint }) {
	return {
		workspaceRoot,
		// [{ name, version, kind: 'registry'|'linked', installPath, source }]
		packages,
		// Hash of the resolved dependency set; changes rebind everything.
		fingerprint,
	}
}

/** Provenance label attached to every served doc/guidance item. */
export function provenance(fields) {
	return {
		source: fields.source,
		scope: fields.scope ?? 'release', // 'release' | 'project'
		package: fields.package ?? null,
		requestedVersion: fields.requestedVersion ?? null,
		servedVersion: fields.servedVersion ?? null,
		repo: fields.repo ?? null,
		tag: fields.tag ?? null,
		commit: fields.commit ?? null,
		match: fields.match,
		offline: fields.offline === true,
	}
}

/** Honest unavailable result — never a silent latest/nearby substitution. */
export function unavailable(reason, fields = {}) {
	return {
		status: 'unavailable',
		reason, // e.g. 'git-unavailable' | 'remote-unavailable' | 'tag-absent' | 'metadata-mismatch' | 'no-release-mapping' | 'docs-absent'
		provenance: provenance({ ...fields, match: MATCH.UNAVAILABLE }),
		...(fields.fallback ? { fallback: fields.fallback } : {}),
	}
}

/** Remote tag no longer resolves to the cached commit. Cache is retained. */
export function tagConflict({ cached, remote, ...fields }) {
	return {
		status: 'tag-conflict',
		cached, // { tag, commit }
		remote, // { tag, commit } — commit may be null when the tag was deleted
		provenance: provenance({ ...fields, commit: cached.commit, match: MATCH.CONFLICT }),
	}
}
