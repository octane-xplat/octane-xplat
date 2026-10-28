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

## Media-query candidate

The repository has an experimental Windows `useMediaQuery` leaf for DIP
window dimensions, orientation, pointer/hover capabilities and reduced motion.
It prefers mouse, then pen, then touch as the primary pointer; a hybrid device
can match both fine and coarse `any-pointer` queries. Unknown capabilities and
unsupported features do not match, including under `not`.

```tsx
import { Text, useMediaQuery } from '@octane-xplat/ui'

export function InputLayout() {
  const compactTouch = useMediaQuery(
    '(max-width: 1024px) and (pointer: coarse) and (hover: none)',
  )
  return <Text>{compactTouch ? 'Compact touch layout' : 'Standard layout'}</Text>
}
```

The leaf samples Windows animation preferences, allowing the existing
`useStreamingText` reduced-motion branch to settle text immediately when the
host reports animations disabled. It refreshes on primary-root layout, the
preview core's resize event and app launch/resume. Live device hotplug and
settings-change delivery are unqualified.

```tsx
import { Text, useStreamingText } from '@octane-xplat/ui'

export function Reply(props: { text: string; isStreaming: boolean }) {
  const visibleText = useStreamingText(props.text, props.isStreaming)
  return <Text>{visibleText}</Text>
}
```

This remains a source candidate: helper tests use mocked projections, and
read-only .NET API checks do not qualify NativeScript hook execution, actual
WinRT projection, OS input or accessibility. See the
[Windows evidence record](../../.agents/docs/parity/windows-support-progress.md).
