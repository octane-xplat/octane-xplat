// Match the AppKit CLI's OS suffixes; mobile leaves are not AppKit fallbacks.
export const APPKIT_EXTENSIONS = [
	'.macos.tsrx', '.tsrx', '.macos.tsx', '.tsx', '.macos.ts', '.ts',
	'.mjs', '.mts', '.jsx', '.js', '.json',
]
export const APPKIT_TESTS = [
	'src/**/*.macos.mobile.test.{ts,tsx,tsrx}',
	'src/**/*appkit.mobile.test.{ts,tsx,tsrx}',
	'src/**/appkit-*.mobile.test.{ts,tsx,tsrx}',
	'src/**/*.macos.test.{ts,tsx,tsrx}',
]
