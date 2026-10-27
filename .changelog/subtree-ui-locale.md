### Change Selector and Pagination language within a screen

`InternationalizationProvider` scopes static UI strings and direction to a
subtree. French strings, sparse overrides, and RTL pagination chevrons are
available without changing the app's global locale.

```tsx
import { InternationalizationProvider, Selector, frFR } from '@octane-xplat/ui'

<InternationalizationProvider locale="fr-FR" messages={{ 'fr-FR': frFR }}>
  <Selector label="Region" options={[]} />
</InternationalizationProvider>
```

`useAnnounce()` exposes polite/assertive web live regions and native platform
announcements. Web pagination previous/next controls now accept Enter and Space.
Native announcements do not support politeness or explicit clearing; actual
assistive-technology delivery requires host verification. See the
[localization guide](https://octane-xplat.goddardai.org/app/localization/).
