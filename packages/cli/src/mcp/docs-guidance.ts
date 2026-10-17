// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Tailored agent guidance (plans/octane-xplat-mcp.md: "explains how to
// discover capabilities, select a target, inspect current source, run and
// iterate, and qualify verification claims"). Entries are scoped guidance —
// project identity comes from the resolved installation, never guessed.

import { SOURCES, provenance, MATCH } from './contract.ts'

const section = (id, title, body) => ({ id, title, body })

/**
 * Guidance entries tailored to the resolved project context.
 * @param {{ packages: Array<{name:string,version:string,kind:string}>,
 *   discrepancies: string[] }} install
 */
export function tailoredGuidance(install) {
	const versions = [...new Set(install.packages.map((p) => `${p.name}@${p.version}`))]
	const linked = install.packages.filter((p) => p.kind === 'linked')

	const entries = [
		section(
			'capabilities',
			'Discover capabilities before acting',
			`Call the project-status capability first: it reports detected identity, ` +
				`resolved framework versions (${versions.join(', ') || 'none detected'}), guidance, ` +
				`documentation and index status, supported platforms, and missing prerequisites. ` +
				`Treat a missing toolchain or device as reported — never as ready.`,
		),
		section(
			'target',
			'Select an explicit app and target',
			`Choose the app and platform target explicitly, or reuse an already bound session. ` +
				`Web (Chromium) is the first qualified runtime target; iOS, Android, macOS, Linux ` +
				`and Windows each carry their own capability matrix. If two targets are equally ` +
				`plausible and change the result, ask the developer to choose.`,
		),
		section(
			'inspect',
			'Ground answers in current source and version-matched docs',
			`Search results are leads. Before recommending or changing an API, open the ` +
				`version-matched documentation page or the installed package source. Docs bind ` +
				`to the installed version (${versions.join(', ') || 'unresolved'}), not latest; ` +
				`changed or deleted content must be revalidated before reuse.`,
		),
		section(
			'iterate',
			'Run and iterate through the app toolchain',
			`Use the app's own dev target (\`xplat dev\` for web/Chromium; the platform-specific ` +
				`dev command for native targets). A successful build is not a passing runtime ` +
				`check: distinguish build completed, app launched, and app ready.`,
		),
		section(
			'claims',
			'Qualify every verification claim',
			`Report the check actually performed: platform, target, interaction mechanism ` +
				`(handler dispatch, DOM event, or OS input), and build/session identity. Handler ` +
				`dispatch cannot prove hit-testing or OS-input journeys, and a passing check on ` +
				`one platform never implies parity on another.`,
		),
	]

	if (linked.length) {
		entries.push(
			section(
				'linked',
				'Linked framework checkouts are development content',
				`${linked.map((p) => `${p.name}@${p.version}`).join(', ')} resolve to a local ` +
					`checkout, not a release. Their docs come from the checkout's current source ` +
					`and are labeled development content — do not cite them as a release version.`,
			),
		)
	}

	for (const note of install.discrepancies) {
		entries.push(
			section(
				'discrepancy',
				'Resolve the install/lockfile discrepancy',
				`${note}. ` +
					`Guidance follows the actual installation; reinstall or update the lockfile ` +
					`to make the two agree.`,
			),
		)
	}

	return entries.map((e) => ({
		...e,
		provenance: provenance({
			source: SOURCES.PROJECT_GUIDANCE,
			scope: 'project',
			match: MATCH.EXACT,
		}),
	}))
}
