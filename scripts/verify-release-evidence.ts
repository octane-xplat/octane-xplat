#!/usr/bin/env node
// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Release-evidence gate. Two halves:
//
//   record  — records the jobs for one track and revision. Published as the
//             workflow artifact `ci-evidence-<track>-<sha>` for the `ci`
//             track and `ci-evidence-stable-<tree>` for `stable`.
//
//   verify  — runs in release.yml's `gate` and `nightly-gate` jobs before
//             anything publishes. Locates the completed CI run that tested
//             the exact revision (or, for stable, the exact tree) being
//             released, downloads its evidence artifact, and resolves the
//             requested release track (see scripts/release-channel.ts), or
//             'none' when its required jobs did not pass. The channel is
//             written to GITHUB_OUTPUT; the run only fails when the evidence
//             itself is missing or mismatched — except stable verification,
//             where absent evidence means "unqualified" and exits cleanly so
//             the caller can run Stable CI inline instead. Publishing may
//             never publish source from a different tested revision.
//
// Usage:
//   node scripts/verify-release-evidence.ts record --track ci \
//        --jobs '<json of needs context>' --sha <sha> --run-id <id> --out <dir>
//   Stable record also requires --tree <tree of sha>.
//   node scripts/verify-release-evidence.ts verify --track ci --sha <sha> [--run-id <id>]
//   node scripts/verify-release-evidence.ts verify --track stable --tree <tree>
//        [--out <dir>]
//
// verify expects GH_TOKEN/GITHUB_TOKEN in env for `gh api` calls.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import {
	appendFileSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { RELEASE_TRACKS, verifyEvidence } from './release-channel.ts'

const args = process.argv.slice(2)
const mode = args[0]
const value = (name) => {
	const i = args.indexOf(`--${name}`)
	return i >= 0 ? args[i + 1] : undefined
}

let sha = value('sha') ?? (mode === 'record' ? process.env.GITHUB_SHA : undefined)
// GITHUB_RUN_ID is only meaningful in record mode (the CI run recording its
// own evidence). In verify mode this script runs in release.yml, where
// GITHUB_RUN_ID is the release run — never the CI run being verified.
const runId = value('run-id') ?? (mode === 'record' ? process.env.GITHUB_RUN_ID : undefined)
const outDir = value('out') ?? '.ci-evidence'
const track = value('track') ?? 'stable'
assert.ok(Object.hasOwn(RELEASE_TRACKS, track), `unknown release track: ${track}`)
const required = RELEASE_TRACKS[track].jobs
const tree = value('tree')

if (mode === 'record') {
	assert.ok(sha, '--sha or GITHUB_SHA required')
	assert.ok(runId, '--run-id or GITHUB_RUN_ID required')
	if (track === 'stable') {
		assert.ok(tree, '--tree required for stable evidence')
	}

	const needs = JSON.parse(value('jobs') ?? '{}')
	const jobs = Object.fromEntries(required.map((job) => [job, needs[job]?.result ?? 'absent']))

	const status = Object.values(jobs).every((r) => r === 'success') ? 'success' : 'failure'

	mkdirSync(outDir, { recursive: true })
	const file = join(outDir, 'ci-evidence.json')
	writeFileSync(
		file,
		JSON.stringify(
			{
				track,
				...(track === 'stable' ? { tree } : {}),
				sha,
				runId: Number(runId),
				status,
				required,
				jobs,
				recordedAt: new Date().toISOString(),
			},
			null,
			2,
		) + '\n',
	)

	console.log(`evidence: ${status} — ${file}`)
	console.log(JSON.stringify(jobs, null, 2))
	process.exit(0)
}

if (mode === 'verify') {
	if (track === 'stable') {
		assert.ok(tree, '--tree required for stable verification')
	} else {
		assert.ok(sha, '--sha required')
	}
	const repo = process.env.GITHUB_REPOSITORY
	assert.ok(repo, 'GITHUB_REPOSITORY required')
	const gh = (path) => execFileSync('gh', ['api', path], { encoding: 'utf8' })

	const artifactName = `ci-evidence-${track}-${track === 'stable' ? tree : sha}`
	const findArtifact = (id) => {
		const { artifacts = [] } = JSON.parse(
			gh(`repos/${repo}/actions/runs/${id}/artifacts?per_page=100`),
		)
		const matches = artifacts.filter((artifact) => artifact.name === artifactName)
		assert.ok(matches.length <= 1, 'ambiguous release evidence artifacts')
		return matches[0]
	}

	let evidenceRunId = runId ? Number(runId) : null
	let artifact = evidenceRunId ? findArtifact(evidenceRunId) : null
	if (evidenceRunId) {
		assert.ok(
			artifact,
			`CI run ${evidenceRunId} produced no ${artifactName} artifact — ` +
				'the tested revision carried no release evidence',
		)
	} else {
		// No explicit run: search only this track's workflow and event. Stable
		// evidence lives on the release pull request's completed runs; a ci
		// lookup filters to the exact tested SHA.
		const { workflow, event } = RELEASE_TRACKS[track]
		const query =
			track === 'stable'
				? `repos/${repo}/actions/workflows/${workflow}/runs?event=${event}&branch=release/lockstep&status=completed&per_page=20`
				: `repos/${repo}/actions/workflows/${workflow}/runs?head_sha=${sha}&status=completed&event=${event}&per_page=10`
		const runs = JSON.parse(gh(query))

		for (const run of runs.workflow_runs ?? []) {
			artifact = findArtifact(run.id)
			if (artifact) {
				evidenceRunId = run.id
				break
			}
		}

		if (!evidenceRunId) {
			if (track === 'stable') {
				// Not yet qualified is a normal state, not an error — the caller
				// decides whether to run Stable CI inline for this tree.
				console.log(`no Stable CI run carried evidence for tree ${tree} — unqualified`)
				if (process.env.GITHUB_OUTPUT) {
					appendFileSync(process.env.GITHUB_OUTPUT, 'channel=none\nsha=\n')
				}
				process.exit(0)
			}
			assert.ok(
				evidenceRunId,
				`no completed CI run for ${sha} carried release evidence — ` +
					'publish only revisions CI tested',
			)
		}
	}

	assert.ok(!artifact.expired, 'CI release evidence has expired')
	const run = JSON.parse(gh(`repos/${repo}/actions/runs/${evidenceRunId}`))
	const { jobs } = JSON.parse(
		gh(`repos/${repo}/actions/runs/${evidenceRunId}/jobs?filter=latest&per_page=100`),
	)

	mkdirSync(outDir, { recursive: true })
	const tmp = mkdtempSync(join(tmpdir(), 'ci-evidence-'))

	const zipPath = join(tmp, 'evidence.zip')
	// gh api streams the zip to stdout — capture it as a raw buffer.
	const binary = execFileSync('gh', ['api', `repos/${repo}/actions/artifacts/${artifact.id}/zip`], {
		maxBuffer: 64 * 1024 * 1024,
	})

	writeFileSync(zipPath, binary)
	const unzip = spawnSync('unzip', ['-o', zipPath, '-d', tmp], { stdio: 'inherit' })
	assert.equal(unzip.status, 0, 'unzip failed')
	const evidenceFile = readdirSync(tmp).find((f) => f === 'ci-evidence.json')
	assert.ok(evidenceFile, 'artifact did not contain ci-evidence.json')
	const evidence = JSON.parse(readFileSync(join(tmp, evidenceFile), 'utf8'))
	sha ??= evidence.sha

	const channel = verifyEvidence(evidence, {
		sha,
		tree,
		runId: evidenceRunId,
		track,
		repository: repo,
		run,
		jobs,
	})

	rmSync(tmp, { recursive: true, force: true })
	console.log(`release channel: ${channel} — CI run ${evidenceRunId} at ${sha}`)
	for (const job of required) {
		console.log(`  ${job}: ${evidence.jobs?.[job] ?? 'absent'}`)
	}

	if (channel === 'none') {
		console.log(`${track} qualification did not pass for this revision — nothing to release`)
	}

	if (process.env.GITHUB_OUTPUT) {
		appendFileSync(process.env.GITHUB_OUTPUT, `channel=${channel}\nsha=${sha}\n`)
	}

	process.exit(0)
}

console.error('usage: verify-release-evidence.ts <record|verify> --track <ci|stable> ...')
process.exit(2)
