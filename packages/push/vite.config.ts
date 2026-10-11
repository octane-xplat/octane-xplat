import { defineConfig } from 'vite'

// Library build — pure TypeScript service leaf (no JSX/.tsrx, so no octane
// plugin needed). Emits dist/web + dist/native + dist/macos ES modules; platform SDKs stay
// external and are resolved by the consuming app.

export default defineConfig(({ mode }) => {
	const native = mode === 'native'
	const target = mode === 'macos' ? 'macos' : native ? 'native' : 'web'
	return {
		build: {
			lib: {
				entry: target === 'native' ? 'src/index.ts' : `src/index.${target}.ts`,
				formats: ['es'],
			},
			outDir: `dist/${target}`,
			emptyOutDir: true,
			minify: false,
			rollupOptions: {
				output: {
					preserveModules: true,
					entryFileNames: 'index.js',
					// `octane` is external, so `resolve.alias` never fires —
					// rewrite the specifier at emit: native must not bundle
					// the DOM runtime. (Defense-in-depth — this leaf imports no
					// octane today; check-native-dist gates the output.)
					paths: native ? (id) => (id === 'octane' ? 'octane/universal/native' : id) : undefined,
				},
				external: [/^octane/, /^@nativescript\//, /^@nativescript-community\//, /^firebase\//],
			},
		},
		resolve: {
			conditions: [target],
		},
	}
})
