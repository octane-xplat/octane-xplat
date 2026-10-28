### Choose native locale formatting without app-owned polyfill dependencies

The localization package now provides explicit Intl initialization entries for
formatting, sorting, segmentation, locale data, and time zones. UI remains
usable without automatic polyfill installation. Table and Typeahead handle
partially installed Intl APIs and pick up capabilities installed later.

```ts
// Native bootstrap, before importing the application:
import '@octane-xplat/lingui/polyfills/locales/de'

console.log(new Intl.NumberFormat('de').format(1234.5)) // 1.234,5
```

[Native Intl setup and limits](https://octane-xplat.goddardai.org/app/localization#opt-in-to-intl-on-native)
