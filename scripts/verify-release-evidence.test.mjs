import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { parse } from 'yaml'
import { RELEASE_TRACKS, releaseChannel, verifyEvidence } from './release-channel.ts'

const repository = 'octane-xplat/octane-xplat'
const sha = 'a'.repeat(40)

function fixture(track = 'stable') {
	const { workflow, event, jobs: required } = RELEASE_TRACKS[track]
	const jobs = Object.fromEntries(required.map((job) => [job, 'success']))
	const runId = track === 'nightly' ? 100 : 200
	const evidence = {
		track,
		sha,
		runId,
		status: 'success',
		required: [...required],
		jobs,
		...(track === 'stable' ? { nightlyRunId: 100 } : {}),
	}
	const run = {
		id: runId,
		// workflow_run may start after main has advanced past the tested push.
		head_sha: track === 'stable' ? 'b'.repeat(40) : sha,
		head_branch: 'main',
		repository: { full_name: repository },
		head_repository: { full_name: repository },
		path: `.github/workflows/${workflow}`,
		event,
		status: 'completed',
		conclusion: 'success',
	}
	const context = {
		sha,
		runId,
		track,
		repository,
		run,
		jobs: required.map((name) => ({ name, conclusion: 'success' })),
	}
	if (track === 'stable') {
		const source = fixture('nightly')
		context.nightly = { run: source.context.run, jobs: source.context.jobs }
	}
	return { evidence, context }
}

test('nightly qualification does not depend on any stable job', () => {
	const jobs = { checks: 'success' }
	assert.equal(releaseChannel(jobs, 'nightly'), 'nightly')
	for (const lane of RELEASE_TRACKS.stable.jobs.filter((job) => job !== 'checks')) {
		for (const result of ['failure', 'cancelled', 'skipped', 'absent']) {
			assert.equal(releaseChannel({ ...jobs, [lane]: result }, 'nightly'), 'nightly')
		}
	}
})

test('each track fails closed when any required gate does not pass', () => {
	for (const track of ['nightly', 'stable']) {
		const { evidence } = fixture(track)
		assert.equal(releaseChannel(evidence.jobs, track), track)
		for (const lane of RELEASE_TRACKS[track].jobs) {
			for (const result of ['failure', 'cancelled', 'skipped', undefined]) {
				assert.equal(
					releaseChannel({ ...evidence.jobs, [lane]: result }, track),
					'none',
					`${track}/${lane}/${result}`,
				)
			}
		}
	}
	assert.equal(releaseChannel(undefined, 'nightly'), 'none')
	assert.throws(() => releaseChannel({}, 'unknown'), /unknown release track/)
})

test('recording evidence covers the complete job set for its track', () => {
	const out = mkdtempSync(join(tmpdir(), 'release-evidence-test-'))
	try {
		for (const track of ['nightly', 'stable']) {
			const { evidence } = fixture(track)
			for (const result of ['absent', 'failure', 'skipped', 'success']) {
				const needs = Object.fromEntries(
					Object.keys(evidence.jobs).map((job) => [job, { result: 'success' }]),
				)
				const lane = RELEASE_TRACKS[track].jobs.at(-1)
				if (result === 'absent') {
					delete needs[lane]
				} else {
					needs[lane] = { result }
				}
				const run = spawnSync(
					process.execPath,
					[
						'scripts/verify-release-evidence.ts',
						'record',
						'--track',
						track,
						'--jobs',
						JSON.stringify(needs),
						'--sha',
						sha,
						'--run-id',
						'200',
						'--nightly-run-id',
						'100',
						'--out',
						out,
					],
					{ encoding: 'utf8' },
				)
				assert.equal(run.status, 0, run.stderr)
				const actual = JSON.parse(readFileSync(join(out, 'ci-evidence.json'), 'utf8'))
				assert.equal(actual.track, track)
				assert.equal(actual.status, result === 'success' ? 'success' : 'failure')
				assert.equal(actual.jobs[lane], result)
				assert.deepEqual(actual.required, RELEASE_TRACKS[track].jobs)
				if (track === 'stable') {
					assert.equal(actual.nightlyRunId, 100)
				}
			}
		}
	} finally {
		rmSync(out, { recursive: true, force: true })
	}
})

test('release evidence rejects mismatched artifacts, workflows and live job results', () => {
	const cases = [
		[
			'track',
			({ evidence }) => {
				evidence.track = 'stable'
			},
		],
		[
			'SHA',
			({ evidence }) => {
				evidence.sha = 'wrong'
			},
		],
		[
			'run ID',
			({ evidence }) => {
				evidence.runId = 999
			},
		],
		[
			'gate set',
			({ evidence }) => {
				evidence.required = []
			},
		],
		[
			'status',
			({ evidence }) => {
				evidence.status = 'failure'
			},
		],
		[
			'run identity',
			({ context }) => {
				context.run.id = 999
			},
		],
		[
			'tested revision',
			({ context }) => {
				context.run.head_sha = 'wrong'
			},
		],
		[
			'branch',
			({ context }) => {
				context.run.head_branch = 'feature'
			},
		],
		[
			'repository',
			({ context }) => {
				context.run.repository.full_name = 'other/repo'
			},
		],
		[
			'fork',
			({ context }) => {
				context.run.head_repository.full_name = 'other/repo'
			},
		],
		[
			'workflow',
			({ context }) => {
				context.run.path = '.github/workflows/other.yml'
			},
		],
		[
			'event',
			({ context }) => {
				context.run.event = 'pull_request'
			},
		],
		[
			'pending run',
			({ context }) => {
				context.run.status = 'in_progress'
			},
		],
		[
			'cancelled run',
			({ context }) => {
				context.run.conclusion = 'cancelled'
			},
		],
		[
			'failed live job',
			({ context }) => {
				context.jobs[0].conclusion = 'failure'
			},
		],
		[
			'missing live job',
			({ context }) => {
				context.jobs = []
			},
		],
		[
			'duplicate job name',
			({ context }) => {
				context.jobs.push({ ...context.jobs[0] })
			},
		],
	]
	for (const [label, mutate] of cases) {
		const value = fixture('nightly')
		mutate(value)
		assert.throws(() => verifyEvidence(value.evidence, value.context), undefined, label)
	}
})

test('stable qualification binds to its nightly push even when main has advanced', () => {
	const { evidence, context } = fixture()
	assert.notEqual(context.run.head_sha, sha)
	assert.equal(verifyEvidence(evidence, context), 'stable')
	for (const mutate of [
		(value) => {
			delete value.evidence.nightlyRunId
		},
		(value) => {
			value.context.nightly.run.id = 999
		},
		(value) => {
			value.context.nightly.run.head_sha = 'wrong'
		},
		(value) => {
			value.context.nightly.run.event = 'pull_request'
		},
		(value) => {
			value.context.nightly.run.conclusion = 'cancelled'
		},
		(value) => {
			value.context.nightly.jobs[0].conclusion = 'failure'
		},
	]) {
		const value = fixture()
		mutate(value)
		assert.throws(() => verifyEvidence(value.evidence, value.context))
	}
})

// Exercise the real CLI download/discovery/output path with a local gh stand-in.
// No network calls or publishing credentials are used by these tests.
function withGithubFixture(callback) {
	const directory = mkdtempSync(join(tmpdir(), 'release-cli-test-'))
	try {
		const { evidence, context } = fixture()
		writeFileSync(join(directory, 'ci-evidence.json'), JSON.stringify(evidence))
		const zip = join(directory, 'evidence.zip')
		const packed = spawnSync('zip', ['-q', zip, 'ci-evidence.json'], {
			cwd: directory,
			encoding: 'utf8',
		})
		assert.equal(packed.status, 0, packed.stderr)
		const base = `repos/${repository}/actions`
		const responses = {
			[`${base}/runs/200/artifacts?per_page=100`]: {
				artifacts: [{ id: 1, name: `ci-evidence-stable-${sha}` }],
			},
			[`${base}/runs/200`]: context.run,
			[`${base}/runs/200/jobs?filter=latest&per_page=100`]: { jobs: context.jobs },
			[`${base}/runs/100`]: context.nightly.run,
			[`${base}/runs/100/jobs?filter=latest&per_page=100`]: { jobs: context.nightly.jobs },
			[`${base}/workflows/stable.yml/runs?status=completed&event=workflow_run&per_page=10`]: {
				workflow_runs: [{ id: 200 }],
			},
		}
		const data = join(directory, 'responses.json')
		writeFileSync(data, JSON.stringify(responses))
		const gh = join(directory, 'gh')
		writeFileSync(
			gh,
			`#!/usr/bin/env node
import { readFileSync } from 'node:fs'
const path = process.argv[3]
if (path.endsWith('/artifacts/1/zip')) process.stdout.write(readFileSync(process.env.EVIDENCE_ZIP))
else {
  const responses = JSON.parse(readFileSync(process.env.EVIDENCE_RESPONSES, 'utf8'))
  if (!Object.hasOwn(responses, path)) throw new Error('unexpected gh request: ' + path)
  process.stdout.write(JSON.stringify(responses[path]))
}
`,
		)
		chmodSync(gh, 0o755)
		const output = join(directory, 'output')
		const execute = (args) =>
			spawnSync(
				process.execPath,
				[
					'scripts/verify-release-evidence.ts',
					'verify',
					'--track',
					'stable',
					'--out',
					join(directory, 'verified'),
					...args,
				],
				{
					encoding: 'utf8',
					env: {
						...process.env,
						PATH: `${directory}:${process.env.PATH}`,
						GITHUB_REPOSITORY: repository,
						GITHUB_SHA: 'c'.repeat(40),
						GITHUB_RUN_ID: '999',
						GITHUB_OUTPUT: output,
						EVIDENCE_ZIP: zip,
						EVIDENCE_RESPONSES: data,
					},
				},
			)
		callback({ execute, output })
	} finally {
		rmSync(directory, { recursive: true, force: true })
	}
}

test('automatic stable verification publishes the artifact SHA, not the workflow default SHA', () => {
	withGithubFixture(({ execute, output }) => {
		const run = execute(['--run-id', '200'])
		assert.equal(run.status, 0, run.stderr)
		assert.equal(readFileSync(output, 'utf8'), `channel=stable\nsha=${sha}\n`)
	})
})

test('manual stable lookup uses the qualification workflow and ignores the release run ID', () => {
	withGithubFixture(({ execute, output }) => {
		const run = execute(['--sha', sha])
		assert.equal(run.status, 0, run.stderr)
		assert.match(readFileSync(output, 'utf8'), /channel=stable/)
	})
})

test('workflow dependencies keep nightly independent and stable exhaustive', () => {
	const ci = parse(readFileSync('.github/workflows/ci.yml', 'utf8'))
	const stable = parse(readFileSync('.github/workflows/stable.yml', 'utf8'))
	const release = parse(readFileSync('.github/workflows/release.yml', 'utf8'))
	const dependencies = (job) => [job.needs ?? []].flat()
	assert.deepEqual(dependencies(ci.jobs.evidence), RELEASE_TRACKS.nightly.jobs)
	assert.deepEqual(dependencies(stable.jobs.evidence), RELEASE_TRACKS.stable.jobs)
	assert.deepEqual(stable.on.workflow_run.workflows, [ci.name])
	assert.deepEqual(release.on.workflow_run.workflows, [ci.name, stable.name])
	assert.equal(ci.jobs['repo-hygiene'].if, "github.event_name == 'pull_request'")
	const commands = ci.jobs.checks.steps.map((step) => step.run ?? '')
	const prepared = commands.indexOf('pnpm build:packages')
	const checked = commands.indexOf('pnpm check:pack')
	const smoke = commands.indexOf('pnpm check:consumer --no-build --quick')
	assert.ok(
		prepared >= 0 && checked > prepared && smoke > checked,
		'quick packing must follow package preparation and integrity checks',
	)
	for (const id of ['stable-checks', 'native-ios', 'native-ios-tests', 'native-android']) {
		assert.deepEqual(dependencies(stable.jobs[id]), ['checks'])
		const checkout = stable.jobs[id].steps.find((step) =>
			step.uses?.startsWith('actions/checkout@'),
		)
		assert.equal(checkout.with.ref, '${{ env.TESTED_SHA }}')
	}
	for (const id of ['packages', 'tsrx-typegen']) {
		const job = release.jobs[id]
		assert.equal(job.env.TESTED_SHA, '${{ needs.gate.outputs.sha }}')
		for (const step of job.steps.filter((step) => step.name?.toLowerCase().includes('nightly'))) {
			assert.equal(step.if, "needs.gate.outputs.channel == 'nightly'", `${id}/${step.name}`)
		}
	}
	assert.equal(release.jobs.docs.if, "needs.gate.outputs.channel == 'nightly'")
})
