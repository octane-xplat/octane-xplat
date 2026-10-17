#!/usr/bin/env node
// Release-evidence gate. Two halves:
//
//   record  — runs as the final CI job; writes ci-evidence-<sha>.json stating
//             which required jobs ran and their conclusions for THIS sha.
//             Published as the workflow artifact `ci-evidence-<sha>`.
//
//   verify  — runs in release.yml's `gate` job before anything publishes.
//             Locates the completed CI run that tested the exact revision
//             being released, downloads its evidence artifact, and resolves
//             the release channel (see scripts/release-channel.mjs): 'stable'
//             when every required job is green, 'nightly' when checks passed
//             but a native lane did not, 'none' when checks failed. The
//             channel is written to GITHUB_OUTPUT; the run only fails when
//             the evidence itself is missing or mismatched. Publishing may
//             never consume evidence from a different sha — the tested
//             artifacts are the released ones.
//
// Usage:
//   node scripts/ci-evidence.mjs record --jobs '<json of needs context>' \
//        --sha <sha> --run-id <id> --out <dir>
//   node scripts/ci-evidence.mjs verify --sha <sha> [--run-id <id>]
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
	writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { REQUIRED_JOBS, releaseChannel } from './release-channel.mjs'

const args = process.argv.slice(2)
const mode = args[0]
const value = (name) => {
	const i = args.indexOf(`--${name}`)
	return i >= 0 ? args[i + 1] : undefined
}

const sha = value('sha') ?? process.env.GITHUB_SHA
// GITHUB_RUN_ID is only meaningful in record mode (the CI run recording its
// own evidence). In verify mode this script runs in release.yml, where
// GITHUB_RUN_ID is the release run — never the CI run being verified.
const runId = value('run-id') ?? (mode === 'record' ? process.env.GITHUB_RUN_ID : undefined)
const outDir = value('out') ?? '.ci-evidence'

if (mode === 'record') {
	assert.ok(sha, '--sha or GITHUB_SHA required')
	assert.ok(runId, '--run-id or GITHUB_RUN_ID required')
	const needs = JSON.parse(value('jobs') ?? '{}')
	const jobs = Object.fromEntries(REQUIRED_JOBS.map((job) => [job, needs[job]?.result ?? 'absent']))

	const status = Object.values(jobs).every((r) => r === 'success') ? 'success' : 'failure'

	mkdirSync(outDir, { recursive: true })
	const file = join(outDir, 'ci-evidence.json')
	writeFileSync(
		file,
		JSON.stringify(
			{
				sha,
				runId: Number(runId),
				status,
				required: REQUIRED_JOBS,
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
	assert.ok(sha, '--sha required (the revision about to be released)')
	const repo = process.env.GITHUB_REPOSITORY
	assert.ok(repo, 'GITHUB_REPOSITORY required')
	const gh = (path) => execFileSync('gh', ['api', path], { encoding: 'utf8' })

	const artifactName = `ci-evidence-${sha}`
	const findArtifact = (id) =>
		JSON.parse(gh(`repos/${repo}/actions/runs/${id}/artifacts?per_page=100`)).artifacts?.find(
			(a) => a.name === artifactName,
		)

	let evidenceRunId = runId ? Number(runId) : null
	let artifact = evidenceRunId ? findArtifact(evidenceRunId) : null
	if (evidenceRunId) {
		assert.ok(
			artifact,
			`CI run ${evidenceRunId} produced no ${artifactName} artifact — ` +
				'the tested revision carried no release evidence',
		)
	} else {
		// Manual dispatch: find the most recent completed push run that tested
		// exactly this sha and carried the evidence artifact. Conclusion may be
		// failure — a red native lane still publishes through the nightly
		// channel, so `status=completed` rather than `status=success`.
		const runs = JSON.parse(
			gh(
				`repos/${repo}/actions/workflows/ci.yml/runs?head_sha=${sha}&status=completed&event=push&per_page=10`,
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

	assert.equal(evidence.sha, sha, `evidence sha ${evidence.sha} !== release sha ${sha}`)
	assert.equal(evidence.runId, evidenceRunId, 'evidence was recorded by a different CI run')

	const channel = releaseChannel(evidence.jobs ?? {})
	console.log(`release channel: ${channel} — CI run ${evidenceRunId} at ${sha}`)
	for (const job of REQUIRED_JOBS) {
		console.log(`  ${job}: ${evidence.jobs?.[job] ?? 'absent'}`)
	}
	if (channel === 'none') {
		console.log('the checks job did not pass for this revision — nothing to release')
	}

	if (process.env.GITHUB_OUTPUT) {
		appendFileSync(process.env.GITHUB_OUTPUT, `channel=${channel}\n`)
	}

	process.exit(0)
}

console.error('usage: ci-evidence.mjs <record|verify> ...')
process.exit(2)
