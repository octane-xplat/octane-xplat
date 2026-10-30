// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import assert from 'node:assert/strict'

// Each list mirrors its workflow's evidence job dependencies. `ci` records a
// green main push; `stable` records the heavy lanes running on the
// bot-maintained release pull request.
export const RELEASE_TRACKS = {
	ci: { workflow: 'ci.yml', event: 'push', jobs: ['checks'] },
	stable: {
		workflow: 'stable.yml',
		event: 'pull_request',
		jobs: ['stable-checks', 'native-ios', 'native-ios-tests', 'native-android'],
	},
}

export function releaseChannel(jobs, track = 'stable') {
	assert.ok(Object.hasOwn(RELEASE_TRACKS, track), `unknown release track: ${track}`)
	return RELEASE_TRACKS[track].jobs.every((job) => jobs?.[job] === 'success') ? track : 'none'
}

// Compare the artifact with GitHub's run and latest job results, rather than
// accepting a jobs map solely because it names the expected revision.
export function verifyEvidence(evidence, { sha, tree, runId, track, repository, run, jobs }) {
	const channel = releaseChannel(evidence.jobs, track)
	const required = RELEASE_TRACKS[track]
	assert.equal(evidence.track, track, 'evidence belongs to a different release track')
	assert.equal(evidence.sha, sha, 'evidence belongs to a different revision')
	if (track === 'stable') {
		// The merge commit differs from the PR head commit; qualification binds
		// to the tree so an unchanged tree merges without re-running the lanes.
		assert.ok(evidence.tree, 'stable evidence has no tree')
		assert.equal(evidence.tree, tree, 'evidence belongs to a different tree')
	}
	assert.equal(evidence.runId, runId, 'evidence was recorded by a different CI run')
	assert.deepEqual(evidence.required, required.jobs, 'evidence does not cover the required jobs')
	assert.equal(evidence.status, channel === 'none' ? 'failure' : 'success')
	assert.equal(run.id, runId, 'GitHub returned a different CI run')
	assert.equal(run.head_sha, sha, 'CI tested a different revision')
	assert.equal(
		run.head_branch,
		track === 'stable' ? 'release/lockstep' : 'main',
		track === 'stable'
			? 'stable evidence must come from the release pull request'
			: 'release evidence must come from main',
	)
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
