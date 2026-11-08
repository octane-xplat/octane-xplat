# Examples and diagnostic probes

Use the examples below alongside their guides. They are source files to adapt
to an app, rather than independently runnable projects.

| Directory | Guide |
| --- | --- |
| `auth/` | [Authentication](../docs/app/authentication.md) and the [server verification boundary](auth/README.md) |
| `accessibility/` | [Platform services](../docs/platform/platform-services.md#announce-a-status) |
| `keep-awake/` | [Keep a screen awake](../docs/platform/keep-awake.md) |
| `media/` | [Platform services](../docs/platform/platform-services.md) |
| `recorder/` | [Media services](../docs/platform/media-services.md) |
| `dictation/` | [Media services](../docs/platform/media-services.md) |
| `updates/` | [App updates](../docs/app/updates.md) |
| `automation/` | [Argent checks](../.agents/docs/argent.md) |

`probes/` contains maintained diagnostic fixtures for the runner in
[`tools/probe/`](../tools/probe/). See [single-case probing](../.agents/docs/probing.md)
for prerequisites, targets, and commands. Keeping a probe here does not mean
that its behavior is covered by an automated regression test or qualified on
every platform. Put temporary investigation cases in gitignored `research/`;
retain fixtures here only for an ongoing diagnostic purpose with a clear owner.
