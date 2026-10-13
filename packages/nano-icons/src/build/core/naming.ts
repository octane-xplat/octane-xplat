// Ported from react-native-nano-icons (MIT, © Software Mansion) — manifest
// identifier naming for generated modules.

/** Word separators in a set name (split → PascalCase parts). */
const NAME_SEPARATORS = /[^a-zA-Z0-9]+/
/** Manifest identifiers must start with a letter. */
const STARTS_WITH_LETTER = /^[a-zA-Z]/

/** "my-tab icons" → "MyTabIcons" — PascalCase base for manifest identifiers. */
export function manifestBaseName(setName: string): string {
	const pascal = setName
		.split(NAME_SEPARATORS)
		.filter(Boolean)
		.map((part) => part[0]!.toUpperCase() + part.slice(1))
		.join('')

	return STARTS_WITH_LETTER.test(pascal) ? pascal : `Set${pascal}`
}
