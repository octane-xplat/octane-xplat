import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'

// Library build — the web runtime ships compiled JS so consumer dev servers
// never recompile workshop internals. Authoring types stay in src; the
// universal index has no renderer or host dependency.
export default defineConfig({
	plugins: octane(),
	build: {
		lib: {
			entry: {
				index: 'src/index.ts',
				'web/index': 'src/web/index.web.ts',
			} as Record<string, string>,
			formats: ['es'],
		},
		outDir: 'dist',
		emptyOutDir: true,
		minify: false,
		rollupOptions: {
			output: { preserveModules: true },
			external: [/^storybook(?:\/|$)/, /^octane/, /^@octane-xplat\//, /^vite$/, /^node:/],
		},
	},
	resolve: {
		conditions: ['web'],
		extensions: [
			'.web.tsrx',
			'.tsrx',
			'.web.tsx',
			'.tsx',
			'.web.ts',
			'.mjs',
			'.mts',
			'.ts',
			'.jsx',
			'.js',
			'.json',
		],
	},
})
