// Numeric x.y.z only — OTA manifests reject prerelease/build suffixes so the
// compare stays a three-integer check (documented in docs/notes/ota-process.md).

const VERSION_RE = /^(\d+)\.(\d+)\.(\d+)$/

export function parseVersion(input: string): [number, number, number] | null {
	const match = VERSION_RE.exec(input)
	if (!match) {
		return null
	}

	return [Number(match[1]), Number(match[2]), Number(match[3])]
}

// -1 when a < b, 0 when equal, 1 when a > b. Returns null when either side
// fails to parse; callers treat that as "cannot compare".
export function compareVersions(a: string, b: string): -1 | 0 | 1 | null {
	const pa = parseVersion(a)
	const pb = parseVersion(b)
	if (!pa || !pb) {
		return null
	}

	for (let i = 0; i < 3; i++) {
		if (pa[i] !== pb[i]) {
			return pa[i] < pb[i] ? -1 : 1
		}
	}

	return 0
}
