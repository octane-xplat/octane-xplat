import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const RELEASES = {
	lockstep: {
		label: 'Octane Xplat',
		prefix: 'v',
		paths: [
			'packages/**',
			...['app', 'demos', 'media-probe', 'typegen-fixture', 'tsrx-typegen'].map(
				(name) => `:(exclude)packages/${name}/**`,
			),
		],
	},
	'tsrx-typegen': {
		label: 'tsrx-typegen',
		prefix: 'tsrx-typegen-v',
		paths: ['packages/tsrx-typegen/**'],
	},
} as const

export type Release = keyof typeof RELEASES

export function releaseName(value: string | undefined): Release {
	assert.ok(value && Object.hasOwn(RELEASES, value), 'release must be lockstep or tsrx-typegen')
	return value as Release
}

export function releaseVersion(value: string): string {
	const version = value.replace(/^v/, '')
	assert.equal(version, version.trim(), 'version cannot contain surrounding whitespace')
	assert.match(
		version,
		/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*)?$/,
		'invalid release version',
	)
	const [core, ...prerelease] = version.split('-')
	assert.ok(
		core.split('.').every((part) => Number.isSafeInteger(Number(part))),
		'version is too large',
	)
	assert.ok(
		!prerelease
			.join('-')
			.split('.')
			.some((part) => /^0\d+$/.test(part)),
		'numeric prerelease identifiers cannot have leading zeros',
	)
	return version
}

// Keep version policy independent of whether a change merits a release note.
export function commitBump(message: string): 'minor' | 'patch' | 'breaking' | undefined {
	const header = /^([a-z]+)(?:\(([^\r\n)]+)\))?(!)?:\s+\S/.exec(message)
	if (!header || header[2] === 'ci') {
		return undefined
	}
	if (header[3] || /^BREAKING[ -]CHANGE:\s+\S/m.test(message)) {
		return 'breaking'
	}
	if (header[1] === 'feat') {
		return 'minor'
	}
	if (['fix', 'perf', 'revert', 'refactor'].includes(header[1])) {
		return 'patch'
	}
	return undefined
}

export function resolveRelease(root: string, release: Release, override = '') {
	const git = (...args: string[]) =>
		execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
	const { prefix, paths } = RELEASES[release]
	const tags = git(
		'tag',
		'--merged',
		'HEAD',
		'--list',
		`${prefix}*`,
		'--sort=-version:refname',
	).split('\n')
	const previous = tags.find((tag) =>
		/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag.slice(prefix.length)),
	)
	let version: string
	if (override) {
		version = releaseVersion(override)
	} else {
		const messages = git(
			'log',
			'--format=%B%x00',
			previous ? `${previous}..HEAD` : 'HEAD',
			'--',
			...paths,
		)

		const bumps = messages.split('\0').map((message) => commitBump(message.trim()))
		if (!bumps.some(Boolean)) {
			return { shouldRelease: false }
		}

		if (!previous) {
			version = '0.1.0'
		} else {
			const [major, minor, patch] = releaseVersion(previous.slice(prefix.length))
				.split('.')
				.map(Number)

			version =
				bumps.includes('breaking') && major > 0
					? `${major + 1}.0.0`
					: bumps.includes('breaking') || bumps.includes('minor')
						? `${major}.${minor + 1}.0`
						: `${major}.${minor}.${patch + 1}`
		}
	}
	const tag = `${prefix}${version}`
	return { shouldRelease: !git('tag', '--list', tag), version, tag }
}

// The GitHub Release is the completion marker: both release jobs create it
// only after `pnpm publish` succeeds, so a tag without its release means an
// unfinished publication, not a shipped one.
function defaultReleaseExists(tag: string): boolean {
	const repo = process.env.GITHUB_REPOSITORY ?? 'octane-xplat/octane-xplat'
	const run = spawnSync('gh', ['api', `repos/${repo}/releases/tags/${tag}`], {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	if (run.status === 0) {
		return true
	}
	if (/HTTP 404|Not Found/.test(run.stderr)) {
		return false
	}
	throw new Error(
		`could not check the GitHub release for ${tag}: ${run.stderr.trim() || `exit ${run.status}`}`,
	)
}

// A merged release commit carries the next version in its manifests before
// publication completes. Three states: 'untagged' (the version was merged but
// the tag is missing on origin), 'unpublished' (the tag exists but its
// GitHub Release does not — publication stopped partway), and 'released'.
// pending means the version still owes a publication step in either
// incomplete state. The tag check asks origin first so a not-yet-fetched tag
// can't read as untagged, and falls back to fetched tags when no remote is
// reachable.
export function pendingRelease(
	root: string,
	release: Release,
	{ ref, releaseExists }: { ref?: string; releaseExists?: (tag: string) => boolean } = {},
) {
	const git = (...args: string[]) =>
		execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
			.trim()
	const path =
		release === 'lockstep'
			? 'packages/create/compatibility.json'
			: `packages/${release}/package.json`
	const manifest = JSON.parse(
		ref ? git('show', `${ref}:${path}`) : readFileSync(join(root, path), 'utf8'),
	)
	const version = release === 'lockstep' ? manifest.frameworkVersion : manifest.version
	const tag = `${RELEASES[release].prefix}${version}`

	let tagSha = ''
	try {
		const remote = git('ls-remote', '--tags', 'origin', `refs/tags/${tag}`, `refs/tags/${tag}^{}`)
		const lines = remote.split('\n').filter(Boolean)
		// Annotated tags list the tag object plus a peeled ^{commit} line.
		tagSha = (lines.find((line) => line.endsWith('^{}')) ?? lines[0] ?? '').split(/\s+/)[0] ?? ''
	} catch {
		tagSha = ''
	}
	if (!tagSha) {
		try {
			tagSha = git('rev-parse', '--verify', '--quiet', `${tag}^{commit}`)
		} catch {
			tagSha = ''
		}
	}

	if (!tagSha) {
		return { pending: true, state: 'untagged' as const, version, tag, tagSha: '' }
	}
	const state = (releaseExists ?? defaultReleaseExists)(tag) ? 'released' : 'unpublished'
	return { pending: state !== 'released', state, version, tag, tagSha }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	try {
		const [command, name, ...rest] = process.argv.slice(2)
		if (command === 'pending') {
			const refIndex = rest.indexOf('--ref')
			const ref = refIndex >= 0 ? rest[refIndex + 1] : undefined
			assert.equal(
				process.argv.length - (refIndex >= 0 ? 2 : 0),
				4,
				'usage: node scripts/release-version.ts pending <lockstep|tsrx-typegen> [--ref <ref>]',
			)

			const result = pendingRelease(process.cwd(), releaseName(name), { ref })
			console.log(
				`pending=${result.pending}\nstate=${result.state}\nversion=${result.version}\ntag=${result.tag}\ntag_sha=${result.tagSha}`,
			)
		} else {
			assert.equal(
				process.argv.length,
				3,
				'usage: node scripts/release-version.ts <lockstep|tsrx-typegen>',
			)

			const result = resolveRelease(
				process.cwd(),
				releaseName(command),
				process.env.VERSION_OVERRIDE,
			)

			console.log(`should_release=${result.shouldRelease}`)
			if (result.version) {
				console.log(`version=${result.version}\ntag=${result.tag}`)
			}
		}
	} catch (error) {
		console.error(error.message)
		process.exitCode = 1
	}
}
