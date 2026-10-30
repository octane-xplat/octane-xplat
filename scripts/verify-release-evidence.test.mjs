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
const tree = 'e'.repeat(40)

function fixture(track = 'stable') {
	const { workflow, event, jobs: required } = RELEASE_TRACKS[track]
	const jobs = Object.fromEntries(required.map((job) => [job, 'success']))
	const runId = track === 'ci' ? 100 : 200
	const evidence = {
		track,
		sha,
		...(track === 'stable' ? { tree } : {}),
		runId,
		status: 'success',
		required: [...required],
		jobs,
	}
	const run = {
		id: runId,
		head_sha: sha,
		// ci evidence comes from a main push; stable evidence from the
		// bot-maintained release pull request.
		head_branch: track === 'stable' ? 'release/lockstep' : 'main',
		repository: { full_name: repository },
		head_repository: { full_name: repository },
		path: `.github/workflows/${workflow}`,
		event,
		status: 'completed',
		conclusion: 'success',
	}
	const context = {
		sha,
		tree,
		runId,
		track,
		repository,
		run,
		jobs: required.map((name) => ({ name, conclusion: 'success' })),
	}
	return { evidence, context }
}

test('ci qualification does not depend on any stable job', () => {
	const jobs = { checks: 'success' }
	assert.equal(releaseChannel(jobs, 'ci'), 'ci')
	for (const lane of RELEASE_TRACKS.stable.jobs) {
		for (const result of ['failure', 'cancelled', 'skipped', 'absent']) {
			assert.equal(releaseChannel({ ...jobs, [lane]: result }, 'ci'), 'ci')
		}
	}
})

test('each track fails closed when any required gate does not pass', () => {
	for (const track of ['ci', 'stable']) {
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
	assert.equal(releaseChannel(undefined, 'ci'), 'none')
	assert.throws(() => releaseChannel({}, 'unknown'), /unknown release track/)
})

test('recording evidence covers the complete job set for its track', () => {
	const out = mkdtempSync(join(tmpdir(), 'release-evidence-test-'))
	try {
		for (const track of ['ci', 'stable']) {
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
						'--tree',
						tree,
						'--run-id',
						'200',
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
					assert.equal(actual.tree, tree)
				} else {
					assert.equal(actual.tree, undefined)
				}
			}
		}
	} finally {
		rmSync(out, { recursive: true, force: true })
	}
})

test('recording stable evidence requires its tree', () => {
	const run = spawnSync(
		process.execPath,
		[
			'scripts/verify-release-evidence.ts',
			'record',
			'--track',
			'stable',
			'--jobs',
			'{}',
			'--sha',
			sha,
			'--run-id',
			'200',
		],
		{ encoding: 'utf8' },
	)
	assert.notEqual(run.status, 0)
	assert.match(run.stderr, /--tree required/)
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
		const value = fixture('ci')
		mutate(value)
		assert.throws(() => verifyEvidence(value.evidence, value.context), undefined, label)
	}
})

test('stable evidence binds the release pull request, its tested sha, and its tree', () => {
	const { evidence, context } = fixture()
	assert.equal(context.run.event, 'pull_request')
	assert.equal(verifyEvidence(evidence, context), 'stable')
	for (const [label, mutate] of [
		[
			'missing tree',
			(value) => {
				delete value.evidence.tree
			},
		],
		[
			'wrong tree',
			(value) => {
				value.evidence.tree = 'f'.repeat(40)
			},
		],
		[
			'mismatched requested tree',
			(value) => {
				value.context.tree = 'f'.repeat(40)
			},
		],
		[
			'tested revision',
			(value) => {
				value.context.run.head_sha = 'b'.repeat(40)
			},
		],
		[
			'main branch',
			(value) => {
				value.context.run.head_branch = 'main'
			},
		],
		[
			'push event',
			(value) => {
				value.context.run.event = 'push'
			},
		],
	]) {
		const value = fixture()
		mutate(value)
		assert.throws(() => verifyEvidence(value.evidence, value.context), undefined, label)
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
				artifacts: [{ id: 1, name: `ci-evidence-stable-${tree}` }],
			},
			[`${base}/runs/200`]: context.run,
			[`${base}/runs/200/jobs?filter=latest&per_page=100`]: { jobs: context.jobs },
			[`${base}/workflows/stable.yml/runs?event=pull_request&branch=release/lockstep&status=completed&per_page=20`]:
				{ workflow_runs: [{ id: 200 }] },
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

		callback({ execute, output, responses, data })
	} finally {
		rmSync(directory, { recursive: true, force: true })
	}
}

test('stable verification resolves the artifact by tree and publishes the tested SHA', () => {
	withGithubFixture(({ execute, output }) => {
		const run = execute(['--tree', tree])
		assert.equal(run.status, 0, run.stderr)
		assert.equal(readFileSync(output, 'utf8'), `channel=stable\nsha=${sha}\n`)
	})
})

test('stable verification reports none — not an error — when no run carried the tree', () => {
	withGithubFixture(({ execute, output, responses, data }) => {
		responses[
			`repos/${repository}/actions/workflows/stable.yml/runs?event=pull_request&branch=release/lockstep&status=completed&per_page=20`
		] = { workflow_runs: [] }
		writeFileSync(data, JSON.stringify(responses))
		const run = execute(['--tree', tree])
		assert.equal(run.status, 0, run.stderr)
		assert.equal(readFileSync(output, 'utf8'), 'channel=none\nsha=\n')
	})
})

test('stable verification still rejects forged evidence for the searched tree', () => {
	withGithubFixture(({ execute, responses, data }) => {
		const run = { ...responses[`repos/${repository}/actions/runs/200`], head_branch: 'main' }
		responses[`repos/${repository}/actions/runs/200`] = run
		writeFileSync(data, JSON.stringify(responses))
		const rejected = execute(['--tree', tree])
		assert.notEqual(rejected.status, 0)
	})
})

test('workflow dependencies keep ci independent and stable bound to the release PR', () => {
	const ci = parse(readFileSync('.github/workflows/ci.yml', 'utf8'))
	const stable = parse(readFileSync('.github/workflows/stable.yml', 'utf8'))
	const release = parse(readFileSync('.github/workflows/release.yml', 'utf8'))
	const dependencies = (job) => [job.needs ?? []].flat()
	assert.deepEqual(dependencies(ci.jobs.evidence), RELEASE_TRACKS.ci.jobs)
	assert.deepEqual(dependencies(stable.jobs.evidence), RELEASE_TRACKS.stable.jobs)
	assert.deepEqual(stable.on.pull_request.branches, ['main'])
	assert.equal(stable.on.workflow_call.inputs.sha.required, true)
	assert.deepEqual(release.on.workflow_run.workflows, [ci.name])
	assert.equal(ci.jobs['repo-hygiene'].if, "github.event_name == 'pull_request'")
	const commands = ci.jobs.checks.steps.map((step) => step.run ?? '')
	const prepared = commands.indexOf('bun run build:packages')
	const checked = commands.indexOf('bun run check:pack')
	const smoke = commands.indexOf('bun run check:consumer --no-build --quick')
	assert.ok(
		prepared >= 0 && checked > prepared && smoke > checked,
		'quick packing must follow package preparation and integrity checks',
	)
	for (const id of RELEASE_TRACKS.stable.jobs) {
		assert.ok(
			stable.jobs[id].if.includes("github.event.pull_request.head.ref == 'release/lockstep'"),
			`${id} must run only for the release pull request`,
		)
		const checkout = stable.jobs[id].steps.find((step) =>
			step.uses?.startsWith('actions/checkout@'),
		)

		assert.equal(checkout.with.ref, '${{ env.TESTED_SHA }}')
	}
	assert.equal(release.jobs.qualify.uses, './.github/workflows/stable.yml')
	assert.equal(release.jobs.qualify.with.sha, '${{ needs.gate.outputs.lockstep_sha }}')
	assert.deepEqual(dependencies(release.jobs.lockstep), ['gate', 'qualify'])
	assert.equal(release.jobs.docs.if, "needs.gate.outputs.channel == 'ci'")
	assert.match(
		release.jobs['tsrx-typegen'].if,
		/needs\.tsrx-typegen-resume\.result == 'success'/,
	)
	assert.deepEqual(dependencies(release.jobs['tsrx-typegen']), ['gate', 'tsrx-typegen-resume'])
	assert.equal(release.jobs['tsrx-typegen-resume'].concurrency.group, 'release-tsrx-typegen')
	assert.equal(release.jobs['tsrx-typegen'].concurrency.group, 'release-tsrx-typegen')
	assert.equal(release.jobs.nightly.if, "needs.nightly-gate.outputs.publish == 'true'")
})
