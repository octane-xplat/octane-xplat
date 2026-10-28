import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
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

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	try {
		assert.equal(
			process.argv.length,
			3,
			'usage: node scripts/release-version.ts <lockstep|tsrx-typegen>',
		)

		const result = resolveRelease(
			process.cwd(),
			releaseName(process.argv[2]),
			process.env.VERSION_OVERRIDE,
		)

		console.log(`should_release=${result.shouldRelease}`)
		if (result.version) {
			console.log(`version=${result.version}\ntag=${result.tag}`)
		}
	} catch (error) {
		console.error(error.message)
		process.exitCode = 1
	}
}
