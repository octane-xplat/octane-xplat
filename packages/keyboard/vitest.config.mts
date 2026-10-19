import { defineConfig } from 'vitest/config'

// SDK-source tests mock native boundaries while resolving their native-only seam.
export default defineConfig({
	resolve: { conditions: ['native'] },
	ssr: { resolve: { conditions: ['native'] } },
})
