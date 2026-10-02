import { defineConfig } from 'vitest/config'

// Core tests are plain TS over the DOM-free modules — no octane plugin or
// DOM environment needed.
export default defineConfig({ test: { include: ['tests/**/*.test.ts'] } })
