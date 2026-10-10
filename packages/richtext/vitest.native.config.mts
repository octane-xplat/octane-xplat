import { defineConfig } from 'vitest/config'
import native from '../ui/vitest.native.config.mts'

// Leaf readiness tests drive the real nativescript driver (attach →
// `_setupUI` → `loaded`) with a faithful @nativescript/core stub, so the
// real @nativescript-community/octane index must resolve — unlike the
// shared config, which aliases it to octane/universal/native because
// object-driver suites cannot load @nativescript/core at all.
const alias = (native.resolve?.alias ?? []).filter(
	(entry) =>
		!(entry.find instanceof RegExp && entry.find.source === '^@nativescript-community\\/octane$'),
)

export default defineConfig({
	...native,
	resolve: { ...native.resolve, alias },
	test: { include: ['src/**/*.mobile.test.{ts,tsx,tsrx}'], environment: 'node' },
})
