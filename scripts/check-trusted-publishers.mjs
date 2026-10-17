#!/usr/bin/env node
// Preflight for npm trusted publishing. Check the full package set before
// publishing: a mid-publish failure would leave the lockstep set half-released.
// CI may reuse successful checks for up to 24 hours (see cache option below).
//
// Mechanism: exchange the GitHub Actions OIDC token for an npm token per
// package (`POST /-/npm/v1/oidc/token/exchange/package/<name>` — the same
// endpoint npm/pnpm use during publish). The exchange only succeeds when npm
// holds a trusted-publisher config matching this repo + workflow, so probing
// it per package is an exact check of the publish gate. The minted tokens are
// discarded; nothing is published here.
//
// Usage: node scripts/check-trusted-publishers.mjs [package-name ...]
//   No args = check every publishable package except tsrx-typegen.
// Optional TRUSTED_PUBLISHERS_CACHE persists successful checks for 24 hours.
// Only package names, timestamps, and the registry/workflow/job scope are stored.
// Unset it to force a fresh check; npm still authorizes every actual publish.
// Requires ACTIONS_ID_TOKEN_REQUEST_URL/_TOKEN (job needs `id-token: write`).

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { lockstepPackages, publishablePackages } from './publishable.mjs'

const registry = process.env.NPM_CONFIG_REGISTRY ?? 'https://registry.npmjs.org'
const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL
const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN

if (!requestUrl || !requestToken) {
	console.error(
		'check-trusted-publishers: ACTIONS_ID_TOKEN_REQUEST_URL/_TOKEN missing — the job needs `permissions: id-token: write`.',
	)

	process.exit(1)
}

const selected =
	process.argv.length > 2
		? publishablePackages().filter((p) => process.argv.slice(2).includes(p.name))
		: lockstepPackages()

if (!selected.length) {
	console.error('check-trusted-publishers: no matching packages')
	process.exit(1)
}

const cacheFile = process.env.TRUSTED_PUBLISHERS_CACHE
const cacheScope = JSON.stringify([
	registry,
	process.env.GITHUB_REPOSITORY,
	process.env.GITHUB_WORKFLOW_REF,
	process.env.GITHUB_JOB,
])
const now = Date.now()
const maxAge = 24 * 60 * 60 * 1000
let checked = {}
if (cacheFile) {
	try {
		const cache = JSON.parse(await readFile(cacheFile, 'utf8'))
		if (cache.version === 1 && cache.scope === cacheScope) {
			checked = Object.fromEntries(
				Object.entries(cache.checked).filter(
					([, at]) => Number.isFinite(at) && at <= now && now - at < maxAge,
				),
			)
		}
	} catch {
		// Missing or invalid cache: verify with npm instead.
	}
}

const pending = selected.filter(({ name }) => {
	if (!Object.hasOwn(checked, name)) return true
	console.log(`ok: ${name} has a trusted publisher (cached)`)
	return false
})

if (!pending.length) process.exit(0)

const url = new URL(requestUrl)
url.searchParams.set('audience', `npm:${new URL(registry).hostname}`)
const idRes = await fetch(url, {
	headers: { Accept: 'application/json', Authorization: `Bearer ${requestToken}` },
})

if (!idRes.ok) {
	console.error(`check-trusted-publishers: GitHub OIDC token request failed (${idRes.status})`)
	process.exit(1)
}

const { value: idToken } = await idRes.json()
if (!idToken) {
	console.error('check-trusted-publishers: GitHub OIDC response had no token')
	process.exit(1)
}

const failures = []
for (const { name } of pending) {
	const res = await fetch(
		`${registry}/-/npm/v1/oidc/token/exchange/package/${encodeURIComponent(name)}`,
		{ method: 'POST', headers: { Accept: 'application/json', Authorization: `Bearer ${idToken}` } },
	)

	if (res.ok && (await res.json()).token) {
		checked[name] = Date.now()
		console.log(`ok: ${name} has a trusted publisher`)
		continue
	}

	let detail = `HTTP ${res.status}`
	try {
		detail += ` — ${(await res.json()).message ?? 'unknown error'}`
	} catch {}

	failures.push(`${name}: ${detail}`)
}

if (failures.length) {
	console.error(
		'\nTrusted publishing is not set up for:\n  ' +
			failures.join('\n  ') +
			'\n\nConfigure each on npmjs.com (package settings → Trusted Publisher → ' +
			'GitHub Actions → octane-xplat/octane-xplat, workflow release.yml). ' +
			'For a package that is not published yet, use the trusted-publisher ' +
			'setup for new packages (createPackage permission).',
	)

	process.exit(1)
}

if (cacheFile) {
	await mkdir(dirname(cacheFile), { recursive: true })
	await writeFile(cacheFile, JSON.stringify({ version: 1, scope: cacheScope, checked }) + '\n')
}
