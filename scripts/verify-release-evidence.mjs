#!/usr/bin/env node
// Release-evidence gate. Two halves:
//
//   record  — records the jobs for one track and revision. Published as the
//             workflow artifact `ci-evidence-<track>-<sha>`.
//
//   verify  — runs in release.yml's `gate` job before anything publishes.
//             Locates the completed CI run that tested the exact revision
//             being released, downloads its evidence artifact, and resolves
//             requested release track (see scripts/release-channel.mjs), or
//             'none' when its required jobs did not pass. The
//             channel is written to GITHUB_OUTPUT; the run only fails when
//             the evidence itself is missing or mismatched. Publishing may
//             never publish source from a different tested revision.
//
// Usage:
//   node scripts/verify-release-evidence.mjs record --track nightly \
//        --jobs '<json of needs context>' --sha <sha> --run-id <id> --out <dir>
//   node scripts/verify-release-evidence.mjs verify --track stable --sha <sha> [--run-id <id>]
//        [--out <dir>]
//   Stable record also requires --nightly-run-id <originating push run>.
//   Automatic stable verify can use --run-id alone to resolve the artifact SHA.
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
import { RELEASE_TRACKS, verifyEvidence } from './release-channel.mjs'

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
const nightlyRunId = value('nightly-run-id')

if (mode === 'record') {
	assert.ok(sha, '--sha or GITHUB_SHA required')
	assert.ok(runId, '--run-id or GITHUB_RUN_ID required')
	if (track === 'stable') {
		assert.ok(Number(nightlyRunId) > 0, '--nightly-run-id required for stable evidence')
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
				...(track === 'stable' ? { nightlyRunId: Number(nightlyRunId) } : {}),
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
	assert.ok(sha || (track === 'stable' && runId), '--sha or an explicit stable run ID required')
	const repo = process.env.GITHUB_REPOSITORY
	assert.ok(repo, 'GITHUB_REPOSITORY required')
	const gh = (path) => execFileSync('gh', ['api', path], { encoding: 'utf8' })

	const artifactPrefix = `ci-evidence-${track}-`
	const findArtifact = (id) => {
		const { artifacts = [] } = JSON.parse(
			gh(`repos/${repo}/actions/runs/${id}/artifacts?per_page=100`),
		)
		const matches = artifacts.filter((artifact) =>
			sha ? artifact.name === `${artifactPrefix}${sha}` : artifact.name.startsWith(artifactPrefix),
		)
		assert.ok(matches.length <= 1, 'ambiguous release evidence artifacts')
		return matches[0]
	}

	let evidenceRunId = runId ? Number(runId) : null
	let artifact = evidenceRunId ? findArtifact(evidenceRunId) : null
	if (evidenceRunId) {
		assert.ok(
			artifact,
			`CI run ${evidenceRunId} produced no ${artifactPrefix}${sha ?? '*'} artifact — ` +
				'the tested revision carried no release evidence',
		)
	} else {
		// Manual dispatch: use only this track's workflow, event and exact SHA.
		const { workflow, event } = RELEASE_TRACKS[track]
		const shaFilter = track === 'nightly' ? `head_sha=${sha}&` : ''
		const runs = JSON.parse(
			gh(
				`repos/${repo}/actions/workflows/${workflow}/runs?${shaFilter}status=completed&event=${event}&per_page=10`,
			),
		)

		for (const run of runs.workflow_runs ?? []) {
			artifact = findArtifact(run.id)
			if (artifact) {
				evidenceRunId = run.id
				break
			}
		}
		assert.ok(
			evidenceRunId,
			`no completed CI run for ${sha} carried release evidence — ` +
				'publish only revisions CI tested',
		)
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
	assert.equal(artifact.name, `${artifactPrefix}${sha}`, 'artifact name does not match release SHA')
	let nightly
	if (track === 'stable') {
		assert.ok(Number(evidence.nightlyRunId) > 0, 'stable evidence has no nightly source run')
		nightly = {
			run: JSON.parse(gh(`repos/${repo}/actions/runs/${evidence.nightlyRunId}`)),
			...JSON.parse(
				gh(`repos/${repo}/actions/runs/${evidence.nightlyRunId}/jobs?filter=latest&per_page=100`),
			),
		}
	}

	const channel = verifyEvidence(evidence, {
		sha,
		runId: evidenceRunId,
		track,
		repository: repo,
		run,
		jobs,
		nightly,
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

console.error('usage: verify-release-evidence.mjs <record|verify> --track <nightly|stable> ...')
process.exit(2)
