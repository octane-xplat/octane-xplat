### New package: `@octane-xplat/contacts`

Device address book — read and basic write through `@nativescript/contacts`
on iOS/Android, Contact Picker API on web.

```ts
import { contacts } from '@octane-xplat/contacts'

if ((await contacts.ensure()) === 'granted') {
	const people = await contacts.getAll({ sort: 'lastName' })
}
```

Web is picker-shaped (per-call user selection, read-only). `getById` is
iOS-direct; on Android it filters a full fetch.
