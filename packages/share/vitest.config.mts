import { defineConfig } from 'vitest/config'

// share.file contract tests — pure path/option helpers plus the iOS/Android
// leaves driven through faithful global stubs (same call surfaces the NS
// runtime marshals). Not a substitute for a native smoke run.
export default defineConfig({
	test: { include: ['tests/**/*.test.ts'], environment: 'node' },
})
