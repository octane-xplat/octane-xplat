# `@octane-xplat/contacts`

```sh
pnpm add @octane-xplat/contacts
```

The device address book — reads and basic writes through
`@nativescript/contacts` on iOS/Android, the Contact Picker API
(`navigator.contacts.select`) on web where it exists.

```ts
import { contacts } from '@octane-xplat/contacts'

if ((await contacts.ensure()) === 'granted') {
	const people = await contacts.getAll({ fields: ['name', 'phoneNumbers'], sort: 'lastName' })
	const jane = await contacts.getByName('Jane')
	await contacts.add({ firstName: 'Ada', emails: [{ label: 'work', email: 'ada@example.com' }] })
}
```

Notes:

- `getById` is a direct lookup on iOS; on Android the plugin ships no id
  query, so it fetches the store and filters — call sparingly.
- Web is read-only and picker-shaped: the user selects contacts per call;
  writes and id/name lookups report `unsupported`.
- macOS and Windows report `supported: false` (bridging not wired).
