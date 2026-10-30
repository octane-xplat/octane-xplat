# @octane-xplat/contacts

Read the device address book on iOS and Android, or let someone select contacts
in a browser that supports the Contact Picker API. Native apps can also edit
contacts. Browser access is read-only and limited to the person's selection.

## Read selected contact fields

Install in an existing Xplat app:

```sh
bun add @octane-xplat/contacts
```

Configure the native contacts permission and usage description before running.
Call this function from a **Choose contacts** action; browsers require a user
action to open their picker:

```ts
import { contacts } from '@octane-xplat/contacts'

export async function chooseContacts() {
	if (!contacts.supported || (await contacts.ensure()) !== 'granted') return []
	return contacts.getAll({ fields: ['name', 'phoneNumbers'], sort: 'lastName' })
}
```

On native, the result contains matching address-book entries. In a supported
browser, it contains only the contacts the person picked. Show an empty state
when none are returned and distinguish denied access in your screen. Do not
log contact details while testing; verify a displayed count or a test contact.

ID and name lookups and writes are native-only. Android ID lookup reads the
store and filters it, so avoid repeated lookups for large address books.
macOS and Windows report unsupported. See the
[public contract](https://github.com/octane-xplat/octane-xplat/blob/main/packages/contacts/src/types.ts)
and [device capability handling](https://octane-xplat.goddardai.org/platform-services#the-shared-service-shape)
for integration boundaries.
