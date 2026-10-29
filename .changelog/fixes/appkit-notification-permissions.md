### Read macOS notification permission without prompting

Native macOS notification permission reads now inspect authorization status
without requesting access. Rebuild the native host after updating; older native
metadata reports unsupported rather than falling back to a prompt. Actual OS
permission and delivery qualification remains pending.

```ts
import { notifications } from '@octane-xplat/notifications'

const status = await notifications.getPermissions()
```

See [local notifications](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/local-notifications.md).
