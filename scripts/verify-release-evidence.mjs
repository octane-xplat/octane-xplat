#!/usr/bin/env node
// Release-evidence gate. Two halves:
//
//   record  — runs as the final CI job; writes ci-evidence-<sha>.json stating
//             which required jobs ran and their conclusions for THIS sha.
//             Published as the workflow artifact `ci-evidence-<sha>`.
//
//   verify  — runs in release.yml before anything publishes. Locates the
//             successful CI run that tested the exact revision being released,
//             downloads its evidence artifact, and fails unless every required
//             job is present and green. Publishing may never consume evidence
//             from a different sha — the tested artifacts are the released ones.
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
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const args = process.argv.slice(2)
const mode = args[0]
const value = (name) => {
	const i = args.indexOf(`--${name}`)
	return i >= 0 ? args[i + 1] : undefined
}

// Required CI jobs — keep in sync with the `evidence` job's `needs:` list in
// .github/workflows/ci.yml. Adding a release check means adding a job AND an
// entry here so both sides of the contract move together.
const REQUIRED_JOBS = ['checks', 'native-ios', 'native-ios-tests', 'native-android']

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

	let evidenceRunId = runId ? Number(runId) : null
	if (!evidenceRunId) {
		// Manual dispatch: find the most recent successful CI run that tested
		// exactly this sha.
		const runs = JSON.parse(
			gh(`repos/${repo}/actions/workflows/ci.yml/runs?head_sha=${sha}&status=success&per_page=1`),
		)

		evidenceRunId = runs.workflow_runs?.[0]?.id ?? null
		assert.ok(
			evidenceRunId,
			`no successful CI run found for ${sha} — publish only revisions CI tested`,
		)
	}

	mkdirSync(outDir, { recursive: true })
	const tmp = mkdtempSync(join(tmpdir(), 'ci-evidence-'))
	const list = JSON.parse(gh(`repos/${repo}/actions/runs/${evidenceRunId}/artifacts`))
	const artifact = list.artifacts?.find((a) => a.name === `ci-evidence-${sha}`)
	assert.ok(
		artifact,
		`CI run ${evidenceRunId} produced no ci-evidence-${sha} artifact — ` +
			'the tested revision carried no release evidence',
	)

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
	assert.equal(evidence.status, 'success', `CI evidence status is ${evidence.status}`)
	for (const job of REQUIRED_JOBS) {
		assert.equal(
			evidence.jobs?.[job],
			'success',
			`required CI job ${job} was ${evidence.jobs?.[job] ?? 'absent'} — ` +
				'publication requires every release check green on the same revision',
		)
	}

	console.log(
		`release evidence verified: CI run ${evidenceRunId} at ${sha} — ` +
			REQUIRED_JOBS.join(', ') +
			' all green',
	)

	process.exit(0)
}

console.error('usage: ci-evidence.mjs <record|verify> ...')
process.exit(2)
