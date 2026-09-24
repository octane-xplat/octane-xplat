# Using device features

> Ask the platform service for a capability instead of calling browser or
> native APIs from a screen.

## The shared service shape

Services have the same name on every platform. For example, a screen can use
storage without knowing whether the value lives in browser storage or a native
database:

```ts
import { storage } from '@octane-xplat/platform';

storage.setString('has-seen-welcome', 'true');
const seen = storage.getString('has-seen-welcome');
```

Other services cover permissions, clipboard, sharing, haptics, files,
notifications, safe-area insets, screen size, and app lifecycle.

## Optional capabilities

Some features are not available everywhere. Check support and ask for access
before using the implementation:

```ts
import { permissions } from '@octane-xplat/platform';

const result = await permissions.ensure('camera');
if (result === 'granted') console.log('start camera');
else console.log('camera unavailable');
```

Your screen should show a useful fallback when a capability is unavailable or
the user declines it.

## Keep platform code at the edge

Do not import `navigator`, `document`, NativeScript classes, or OS-specific
plugins into a shared screen. If the service does not exist yet, add its
shared contract and web/native leaves rather than adding a one-off conditional.

See the [platform notes](platform-notes.md) for the complete capability map,
accessibility mapping, and native typing details.
