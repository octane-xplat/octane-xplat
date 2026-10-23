/** The only supported Mason engine on mobile; the old packages ship overlapping native classes. */
export const masonCorePackage = '@octane-xplat/nativescript-mason-core'
export const masonFullPackage = '@octane-xplat/nativescript-masonkit'
export const masonLegacyPackage = '@triniwiz/nativescript-masonkit'

/**
 * The engine the app must build with: core on iOS/Android, full MasonKit in
 * the Windows preview (core ships no Windows artifacts). Rejects engine pins
 * the core cutover replaced.
 */
export function masonEngine(declared: Record<string, unknown>, windows = false) {
	if (windows) {
		if (declared[masonCorePackage]) {
			throw new Error(`${masonCorePackage} supports iOS and Android only; Windows is unqualified.`)
		}

		return masonFullPackage
	}
	const replaced = [masonFullPackage, masonLegacyPackage].filter((name) => declared[name])
	if (replaced.length) {
		throw new Error(
			`${replaced.join(' and ')} was replaced by ${masonCorePackage}; their native classes and libraries overlap. Remove the replaced engine and run xplat upgrade.`,
		)
	}
	return masonCorePackage
}
