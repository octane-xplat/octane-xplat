import { globSync } from 'node:fs'
import { defineConfig } from 'vite'

// The MCP server runs under plain Node from the published tarball — emit
// per-module ESM mirroring src/ so the ./contracts wildcard and bin resolve.
export default defineConfig({
	build: {
		lib: {
			entry: globSync('src/**/*.ts'),
			formats: ['es'],
		},
		outDir: 'dist',
		emptyOutDir: true,
		minify: false,
		rollupOptions: {
			external: [/^node:/, /^@modelcontextprotocol\//, /^@octane-xplat\//, 'zod', 'yaml'],
			output: {
				preserveModules: true,
				preserveModulesRoot: 'src',
			},
		},
	},
})
