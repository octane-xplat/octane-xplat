import { mkdir, readFile, writeFile, symlink } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Prepares an isolated app; builds and device use still require the target lock.
const mobile = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = resolve(process.argv[2] ?? 'research/data-mobile-probe')
await mkdir(output) // Refuse to overwrite another probe or persistent data.
await mkdir(resolve(output, 'src'))
const pkg = JSON.parse(await readFile(resolve(mobile, 'package.json'), 'utf8'))
const dependencies = Object.fromEntries(
	[
		'@nativescript/core',
		'@nativescript-community/octane',
		'octane',
		'@octane-xplat/ui',
		'@valor/nativescript-websockets',
	].map((name) => [name, pkg.dependencies[name]]),
)

await writeFile(
	resolve(output, 'package.json'),
	JSON.stringify(
		{
			name: 'data-lifecycle-probe',
			version: '0.0.0',
			private: true,
			main: 'src/index.ts',
			dependencies,
			devDependencies: pkg.devDependencies,
		},
		null,
		2,
	) + '\n',
)

await symlink(resolve(mobile, 'node_modules'), resolve(output, 'node_modules'))
await symlink(resolve(mobile, 'App_Resources'), resolve(output, 'App_Resources'))
await writeFile(
	resolve(output, 'src/index.ts'),
	'import ' + JSON.stringify(resolve(mobile, 'src/data-probe.ts')) + '\n',
)

await writeFile(
	resolve(output, 'vite.config.mts'),
	"import { defineConfig } from 'vite'\nimport { xplatNative } from '@octane-xplat/cli/vite'\nexport default defineConfig(({ mode }) => xplatNative(mode))\n",
)

await writeFile(
	resolve(output, 'nativescript.config.ts'),
	"export default { id: 'org.octanexplat.datareadiness', appPath: 'src', appResourcesPath: 'App_Resources', cli: { packageManager: 'pnpm' }, bundler: 'vite', bundlerConfigPath: 'vite.config.mts' }\n",
)

console.log(output)
