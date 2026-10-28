### Native localization and text segmentation initialize their own Intl support

Lingui now installs the Intl APIs used by its messages and formatting hooks on
iOS and Android. RollingText supplies text segmentation. Apps do not need to
install FormatJS or initialize those APIs. UI remains independent and handles
missing or partially installed capabilities.

Choose additional Lingui formatting data before activating its catalog:

```ts
// locale-data.mobile.ts
import '@octane-xplat/lingui/locales/de'
```

[Native formatting data](https://octane-xplat.goddardai.org/app/localization#native-formatting-data)
