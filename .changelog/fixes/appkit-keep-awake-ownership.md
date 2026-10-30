### Keep macOS display-sleep requests with their owners

AppKit keep-awake tokens now retain the process object and release method that
created them. Partial bridges report unavailable, and failed releases remain
retryable. Updating a mounted hook's callback or cleanup-warning option no
longer releases and reacquires its request.

```tsx
import { useKeepAwake } from '@octane-xplat/platform'
import { Text } from '@octane-xplat/ui'

export function ReadingScreen(props: { quiet: boolean }) {
	useKeepAwake(undefined, { suppressDeactivateWarnings: props.quiet })
	return <Text>Reading</Text>
}
```

See [native AppKit request ownership](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/keep-awake.md#native-appkit-request-ownership).
Physical sleep prevention, native bridge cleanup and installed-app qualification
remain pending. Explicit tags retain their existing set semantics.
