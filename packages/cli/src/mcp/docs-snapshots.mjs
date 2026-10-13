// Exact-release-tag shallow checkout acquisition and commit-pinned snapshot
// caching (plans/octane-xplat-mcp.md). Snapshots are fetched at depth 1 from
// the release tag, validated against the requested package's metadata, then
// cached by repository identity + package/version + commit. A cached binding
// never moves silently when the remote tag changes; verified snapshots serve
// offline. Checkout content is data — no build scripts or hooks ever run.

import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	renameSync,
	rmSync,
	writeFileSync,
} from 'node:fs'

import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import { MATCH, SOURCES, tagConflict, unavailable } from './contract.mjs'

const execFileP = promisify(execFile)

export function defaultCacheDir() {
	return process.env.XPLAT_MCP_CACHE ?? join(homedir(), '.cache', 'octane-xplat', 'mcp-docs')
}

const repoKey = (repo) => createHash('sha256').update(repo).digest('hex').slice(0, 16)

function gitEnv(env) {
	// Never block on a credential prompt — an auth failure is a result, not a hang.
	return { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_ASKPASS: 'true', ...env }
}

async function git(ctx, args, cwd) {
	const run = ctx.execFile ?? execFileP
	const { stdout } = await run(ctx.gitPath ?? 'git', args, {
		cwd,
		env: gitEnv(ctx.env),
		timeout: ctx.timeoutMs ?? 60_000,
		maxBuffer: 16 * 1024 * 1024,
	})

	return stdout
}

/** `git --version` works → git is usable. */
export async function gitAvailable(ctx) {
	try {
		await git(ctx, ['--version'])
		return true
	} catch {
		return false
	}
}

/**
 * Resolve refs/tags/<tag> on the remote.
 * @returns {Promise<{ commit: string | null }>} commit is null when absent;
 * annotated tags are peeled to their commit.
 */
export async function remoteTagSha(ctx, repo, tag) {
	const out = await git(ctx, ['ls-remote', repo, `refs/tags/${tag}`, `refs/tags/${tag}^{}`])
	let commit = null
	for (const line of out.split('\n')) {
		const [sha, ref] = line.trim().split(/\s+/)
		if (!sha) {
			continue
		}

		if (ref.endsWith('^{}')) {
			return { commit: sha }
		}

		commit = sha
	}

	return { commit }
}

/**
 * Shallow-fetch one tag into the snapshot cache. Returns the validated
 * snapshot directory and the commit actually checked out.
 */
async function acquire(ctx, { repo, tag, packageDir, packageName, version }) {
	mkdirSync(ctx.cacheDir, { recursive: true })
	const tmp = mkdtempSync(join(ctx.cacheDir, 'tmp-'))
	try {
		await git(ctx, ['init', '-q', tmp])
		// core.hooksPath=/dev/null: a fetched repo's hooks must never execute.
		await git(
			ctx,
			['-c', 'core.hooksPath=/dev/null', 'fetch', '-q', '--depth', '1', repo, `refs/tags/${tag}`],
			tmp,
		)

		await git(ctx, ['checkout', '-q', '--detach', 'FETCH_HEAD'], tmp)
		const commit = (await git(ctx, ['rev-parse', 'HEAD'], tmp)).trim()

		let pkg = null
		try {
			pkg = JSON.parse(readFileSync(join(tmp, packageDir, 'package.json'), 'utf8'))
		} catch {
			// Unreadable or absent manifest — the tag cannot serve this package.
		}

		if (pkg?.name !== packageName || pkg?.version !== version) {
			return {
				error: 'metadata-mismatch',
				commit,
				found: { name: pkg?.name, version: pkg?.version },
			}
		}

		const dest = join(ctx.cacheDir, 'snapshots', repoKey(repo), commit)
		if (!existsSync(dest)) {
			mkdirSync(dirname(dest), { recursive: true })
			renameSync(tmp, dest)
		}

		return { dir: dest, commit }
	} finally {
		rmSync(tmp, { recursive: true, force: true })
	}
}

function readBindings(ctx) {
	try {
		return JSON.parse(readFileSync(join(ctx.cacheDir, 'bindings.json'), 'utf8'))
	} catch {
		return {}
	}
}

function writeBindings(ctx, bindings) {
	mkdirSync(ctx.cacheDir, { recursive: true })
	const file = join(ctx.cacheDir, 'bindings.json')
	const tmp = `${file}.${process.pid}.tmp`
	writeFileSync(tmp, JSON.stringify(bindings, null, '\t'))
	renameSync(tmp, file)
}

/**
 * Resolve one package@version to a pinned snapshot.
 *
 * @returns bound snapshot `{ status:'bound', dir, commit, tag, offline }`, a
 * `tag-conflict` result, or an `unavailable` result. `acceptMovedTag: true`
 * is the explicit resolution that rebinds a moved tag.
 */
export async function ensureSnapshot(
	ctx,
	{ packageName, version, repo, tag, packageDir, acceptMovedTag = false },
) {
	const key = `${packageName}@${version}`
	const bindings = readBindings(ctx)
	const cached = bindings[key]

	if (!(await gitAvailable(ctx))) {
		return cached?.dir && existsSync(cached.dir)
			? { status: 'bound', ...pickCached(cached), offline: true }
			: unavailable('git-unavailable', {
					package: packageName,
					requestedVersion: version,
					repo,
					tag,
				})
	}

	let remote
	try {
		remote = await remoteTagSha(ctx, repo, tag)
	} catch {
		// Network/auth failure: verified cache still serves, labeled offline.
		return cached?.dir && existsSync(cached.dir)
			? { status: 'bound', ...pickCached(cached), offline: true }
			: unavailable('remote-unavailable', {
					package: packageName,
					requestedVersion: version,
					repo,
					tag,
				})
	}

	if (!remote.commit) {
		return cached?.dir && existsSync(cached.dir)
			? tagConflict({
					cached: { tag, commit: cached.commit },
					remote: { tag, commit: null },
					package: packageName,
					requestedVersion: version,
					repo,
				})
			: unavailable('tag-absent', { package: packageName, requestedVersion: version, repo, tag })
	}

	if (cached && cached.commit !== remote.commit && !acceptMovedTag) {
		return tagConflict({
			cached: { tag, commit: cached.commit },
			remote: { tag, commit: remote.commit },
			package: packageName,
			requestedVersion: version,
			repo,
		})
	}

	if (cached?.commit === remote.commit && cached.dir && existsSync(cached.dir)) {
		return { status: 'bound', ...pickCached(cached), offline: false }
	}

	let got
	try {
		got = await acquire(ctx, { repo, tag, packageDir, packageName, version })
	} catch {
		return cached?.dir && existsSync(cached.dir)
			? { status: 'bound', ...pickCached(cached), offline: true }
			: unavailable('remote-unavailable', {
					package: packageName,
					requestedVersion: version,
					repo,
					tag,
				})
	}

	if (got.error) {
		return unavailable('metadata-mismatch', {
			package: packageName,
			requestedVersion: version,
			repo,
			tag,
			detail: `tag ${tag} checked out ${got.found?.name}@${got.found?.version ?? 'unreadable'}`,
		})
	}

	if (got.commit !== remote.commit) {
		// Tag moved mid-resolution — never bind a sha we did not verify.
		return tagConflict({
			cached: { tag, commit: cached?.commit ?? null },
			remote: { tag, commit: remote.commit },
			package: packageName,
			requestedVersion: version,
			repo,
		})
	}

	bindings[key] = {
		repo,
		tag,
		commit: got.commit,
		dir: got.dir,
		packageDir,
		verifiedAt: new Date().toISOString(),
	}

	writeBindings(ctx, bindings)
	return { status: 'bound', dir: got.dir, commit: got.commit, tag, offline: false }
}

const pickCached = (cached) => ({ dir: cached.dir, commit: cached.commit, tag: cached.tag })

/** Provenance fields for a bound snapshot (shared guides = COMPATIBLE). */
export function boundProvenance(result, { packageName, version, shared }) {
	return {
		source: SOURCES.RELEASE_DOCS,
		package: packageName,
		requestedVersion: version,
		servedVersion: version,
		repo: result.repo ?? null,
		tag: result.tag,
		commit: result.commit,
		match: shared ? MATCH.COMPATIBLE : MATCH.EXACT,
		offline: result.offline === true,
	}
}
