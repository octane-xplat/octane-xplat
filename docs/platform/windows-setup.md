# Windows support status

> Check the Windows boundary before choosing it for an app.

Windows is an experimental target. The current verified setup is the
framework repository's private `apps/windows` harness; it depends on workspace
packages and preview NativeScript versions. It is a framework development
workflow, not a downstream app setup guide.

`create-octane-xplat` does not currently offer Windows as a selectable target.
The CLI can detect a manually configured NativeScript Windows app, but that
alone does not establish a supported downstream setup. You do not need to clone
the Octane Xplat monorepo just because the framework's own test-harness steps
use it; a supported downstream Windows workflow is not documented yet.

For current app target availability and limits, see
[Choose your targets](../start/spec.md#choose-your-targets). Framework
contributors can use the
[internal Windows test-host runbook](../../.agents/docs/windows-test-host.md).

For current repository implementation candidates and deferred Windows checks,
see the [Windows progress note](../../.agents/docs/parity/windows-support-progress.md).
These candidates do not change the experimental support boundary.
