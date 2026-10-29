import type {
	ShortcutBlocklistCategory,
	ShortcutBlocklistEntry,
	ShortcutBrowser,
	ShortcutPlatform,
} from '../types/public.js'

type BlocklistEntryOptions = {
	category: ShortcutBlocklistCategory
	browser?: ShortcutBrowser
	platform?: ShortcutPlatform
}

export function blocklistEntry(
	combo: string,
	options: BlocklistEntryOptions,
): ShortcutBlocklistEntry {
	return { combo, ...options }
}
