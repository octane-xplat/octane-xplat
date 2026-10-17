// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import assert from 'node:assert/strict'

// Each list mirrors its workflow's evidence job dependencies. Stable's checks
// job verifies the successful nightly evidence for the same revision first.
export const RELEASE_TRACKS = {
	nightly: { workflow: 'ci.yml', event: 'push', jobs: ['checks'] },
	stable: {
		workflow: 'stable.yml',
		event: 'workflow_run',
		jobs: ['checks', 'stable-checks', 'native-ios', 'native-ios-tests', 'native-android'],
	},
}

export function releaseChannel(jobs, track = 'stable') {
	assert.ok(Object.hasOwn(RELEASE_TRACKS, track), `unknown release track: ${track}`)
	return RELEASE_TRACKS[track].jobs.every((job) => jobs?.[job] === 'success') ? track : 'none'
}

// Compare the artifact with GitHub's run and latest job results, rather than
// accepting a jobs map solely because it names the expected revision.
export function verifyEvidence(evidence, { sha, runId, track, repository, run, jobs, nightly }) {
	const channel = releaseChannel(evidence.jobs, track)
	const required = RELEASE_TRACKS[track]
	assert.equal(evidence.track, track, 'evidence belongs to a different release track')
	assert.equal(evidence.sha, sha, 'evidence belongs to a different revision')
	assert.equal(evidence.runId, runId, 'evidence was recorded by a different CI run')
	assert.deepEqual(evidence.required, required.jobs, 'evidence does not cover the required jobs')
	assert.equal(evidence.status, channel === 'none' ? 'failure' : 'success')
	assert.equal(run.id, runId, 'GitHub returned a different CI run')
	if (track === 'nightly') {
		assert.equal(run.head_sha, sha, 'CI tested a different revision')
	} else {
		// workflow_run uses the latest default-branch SHA as its own head_sha.
		// Bind qualification to the triggering push run, even if main advanced.
		assert.ok(Number.isSafeInteger(evidence.nightlyRunId), 'nightly source run is required')
		assert.equal(nightly?.run.id, evidence.nightlyRunId, 'wrong nightly source run')
		const source = nightly.run
		assert.equal(source.head_sha, sha, 'nightly CI tested a different revision')
		assert.equal(source.head_branch, 'main', 'nightly CI must test main')
		assert.equal(source.repository?.full_name, repository, 'wrong nightly repository')
		assert.equal(source.head_repository?.full_name, repository, 'nightly CI tested a fork')
		assert.equal(source.path, '.github/workflows/ci.yml', 'unexpected nightly workflow')
		assert.equal(source.event, 'push', 'nightly CI must test a push')
		assert.equal(source.status, 'completed', 'nightly CI has not completed')
		assert.notEqual(source.conclusion, 'cancelled', 'nightly CI was cancelled')
		assert.equal(
			nightly.jobs.find((job) => job.name === 'checks')?.conclusion,
			'success',
			'nightly readiness did not pass',
		)
	}
	assert.equal(run.head_branch, 'main', 'release evidence must come from main')
	assert.equal(run.repository?.full_name, repository, 'CI ran in a different repository')
	assert.equal(run.head_repository?.full_name, repository, 'CI tested a fork')
	assert.equal(run.path, `.github/workflows/${required.workflow}`, 'unexpected CI workflow')
	assert.equal(run.event, required.event, 'unexpected CI event')
	assert.equal(run.status, 'completed', 'CI has not finished recording evidence')
	assert.notEqual(run.conclusion, 'cancelled', 'CI was superseded or cancelled')
	for (const job of required.jobs) {
		const matches = jobs.filter((entry) => entry.name === job)
		assert.ok(matches.length <= 1, `ambiguous CI job: ${job}`)
		assert.equal(
			matches[0]?.conclusion ?? 'absent',
			evidence.jobs[job],
			`GitHub's latest result disagrees with evidence for ${job}`,
		)
	}

	return channel
}
