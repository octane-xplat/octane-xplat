### Read packaged Windows app metadata

The experimental native Windows app-info adapter reads the installed package's
identifier and four-part version without importing mobile APIs. Unpackaged
hosts report unavailable. Values are read lazily after startup.

```ts
import { appInfo } from '@octane-xplat/platform'

const versionLabel = appInfo.supported ? appInfo.version ?? 'Unknown version' : 'Unavailable'
```

Packaged values and app integration remain unqualified. The standalone x64
check covers only the unavailable result in an unpackaged process.
[App metadata](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/platform-services.md#read-the-installed-app-version)
