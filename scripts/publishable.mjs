import { readdirSync, readFileSync } from 'node:fs'

// Packages that ship to npm. tsrx-typegen is publishable but releases on its
// own cadence (tsrx-typegen-v* tags), so callers filter it when they need the
// lockstep set.
export function publishablePackages(root = '.') {
	const out = []
	for (const dir of readdirSync(`${root}/packages`)) {
		const file = `${root}/packages/${dir}/package.json`
		let pkg
		try {
			pkg = JSON.parse(readFileSync(file, 'utf8'))
		} catch {
			continue
		}

		if (pkg.private) {
			continue
		}

		out.push({ name: pkg.name, version: pkg.version, dir: `packages/${dir}` })
	}

	return out
}

export const LOCKSTEP_EXCLUDE = new Set(['tsrx-typegen'])

export function lockstepPackages(root = '.') {
	return publishablePackages(root).filter((p) => !LOCKSTEP_EXCLUDE.has(p.name))
}
