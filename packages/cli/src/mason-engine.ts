/** Private core prototype; an explicit dependency opts into the mobile build. */
export const masonCorePackage = '@octane-xplat/nativescript-mason-core'
export const masonFullPackage = '@octane-xplat/nativescript-masonkit'
export const masonLegacyPackage = '@triniwiz/nativescript-masonkit'

/** Preserve the app's engine choice and reject overlapping native owners. */
export function selectMasonEngine(declared: Record<string, unknown>, windows = false) {
	if (!declared[masonCorePackage]) {
		return masonFullPackage
	}
	const conflicts = [masonFullPackage, masonLegacyPackage].filter((name) => declared[name])
	if (conflicts.length) {
		throw new Error(
			`${masonCorePackage} cannot be installed with ${conflicts.join(' or ')}; their native classes and libraries overlap. Keep one Mason engine.`,
		)
	}
	if (windows) {
		throw new Error(`${masonCorePackage} supports iOS and Android only; Windows is unqualified.`)
	}
	return masonCorePackage
}
