// Release-channel contract shared by the CI evidence gate and its tests.
//
// REQUIRED_JOBS must mirror the `evidence` job's `needs:` list in
// .github/workflows/ci.yml. Adding a release check means adding a job AND an
// entry here so both sides of the contract move together.
export const REQUIRED_JOBS = ['checks', 'native-ios', 'native-ios-tests', 'native-android']

// Channel for a recorded jobs map ({ job: conclusion }):
//   stable  — every required job succeeded → lockstep vX.Y.Z release
//   nightly — checks succeeded but a native lane did not → prerelease only
//   none    — checks did not succeed → nothing publishes for the revision
export function releaseChannel(jobs) {
	if (jobs?.checks !== 'success') return 'none'
	return REQUIRED_JOBS.every((job) => jobs[job] === 'success') ? 'stable' : 'nightly'
}
