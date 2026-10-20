import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
	mkdtemp,
	mkdir,
	readFile,
	readdir,
	rename,
	rm,
	stat,
	utimes,
	writeFile,
	symlink,
} from 'node:fs/promises'

import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { generateRoutes } from '../dist/commands/routes.js'
import { routePatternPath } from '@octane-xplat/lib/route-pattern'

test('route metadata follows actual value exports without executing source', async () => {
	const root = await mkdtemp(join(tmpdir(), 'xplat-route-exports-'))
	try {
		await mkdir(join(root, 'src/app'), { recursive: true })
		await writeFile(
			join(root, 'src/app/real.tsrx'),
			`
throw new Error('Discovery must not execute modules');
const mode = ('live' as const) satisfies 'baked' | 'live';
const read = () => ({ title: 'ready' });
const guard = () => ({});
export { mode as dataMode, read as loader, guard as beforeLoad };
export { heading as head } from '../callbacks';
export const helper = 1, ErrorBoundary = () => null;
export default function Screen() @{ <label/> }
`,
		)

		await writeFile(
			join(root, 'src/app/baked.tsx'),
			`const mode = 'baked' as const; export { mode as dataMode }; export default function Screen() { return null }`,
		)

		await writeFile(
			join(root, 'src/app/baked.loader.ts'),
			`throw new Error('Do not bake while typechecking'); export const loader = () => null`,
		)

		await writeFile(
			join(root, 'src/app/plain.tsx'),
			`
// export const dataMode = 'baked'; export function loader() {}
const text = "export const head = {}; export function beforeLoad() {}";
export type { loader, head } from '../types';
export default function Screen() { return null }
`,
		)

		await generateRoutes(root, 'src/app', undefined, { bake: false })
		const manifest = JSON.parse(await readFile(join(root, 'src/routes.gen.manifest.json'), 'utf8'))
		const real = manifest.routes.find((route) => route.name === 'real')
		assert.equal(real.dataMode, 'live')
		for (const flag of ['loader', 'guard', 'head', 'errorBoundary']) {
			assert.equal(real[flag], true, flag)
		}

		assert.equal(manifest.routes.find((route) => route.name === 'baked').dataMode, 'baked')
		const plain = manifest.routes.find((route) => route.name === 'plain')
		assert.equal(plain.dataMode, undefined)
		for (const flag of ['loader', 'guard', 'head', 'errorBoundary']) {
			assert.equal(plain[flag], false, flag)
		}
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

test('unresolvable build metadata fails with the route source and repair', async () => {
	const root = await mkdtemp(join(tmpdir(), 'xplat-route-export-errors-'))
	try {
		await mkdir(join(root, 'app'), { recursive: true })
		for (const source of [
			`export const dataMode = chooseMode();`,
			`export { dataMode } from './mode';`,
			`export let dataMode = 'baked';`,
			`export const dataMode = 'unknown';`,
		]) {
			await writeFile(join(root, 'app/item.tsx'), source)
			await assert.rejects(
				generateRoutes(root, 'app', undefined, { bake: false }),
				/route\/invalid-data-mode: app\/item\.tsx: dataMode must resolve to a local const literal/,
			)
		}

		await writeFile(join(root, 'app/item.tsx'), `export * from './callbacks';`)
		await assert.rejects(
			generateRoutes(root, 'app', undefined, { bake: false }),
			/route\/source-exports: app\/item\.tsx: use explicit named exports/,
		)
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

test('unchanged generation preserves files and rename/removal refresh the route union', async () => {
	const root = await mkdtemp(join(tmpdir(), 'xplat-route-stable-'))
	try {
		await mkdir(join(root, 'src/app'), { recursive: true })
		const screen = 'export default function Screen() { return null }'
		await writeFile(join(root, 'src/app/first.tsx'), screen)
		await generateRoutes(root, 'src/app', undefined, { bake: false })
		const files = (await readdir(join(root, 'src'))).filter((name) =>
			name.startsWith('routes.gen.'),
		)

		const stamp = new Date('2001-01-01T00:00:00Z')
		const before = new Map()
		for (const file of files) {
			const path = join(root, 'src', file)
			await utimes(path, stamp, stamp)
			before.set(file, await readFile(path, 'utf8'))
		}

		await generateRoutes(root, 'src/app', undefined, { bake: false })
		for (const file of files) {
			const path = join(root, 'src', file)
			assert.equal(await readFile(path, 'utf8'), before.get(file), file)
			assert.equal((await stat(path)).mtimeMs, stamp.getTime(), file)
		}

		await writeFile(join(root, 'src/app/second.tsx'), screen)
		await generateRoutes(root, 'src/app', undefined, { bake: false })
		assert.match(await readFile(join(root, 'src/routes.gen.contracts.ts'), 'utf8'), /"\/second"/)
		await rename(join(root, 'src/app/second.tsx'), join(root, 'src/app/moved.tsx'))
		await rm(join(root, 'src/app/first.tsx'))
		await generateRoutes(root, 'src/app', undefined, { bake: false })
		const contracts = await readFile(join(root, 'src/routes.gen.contracts.ts'), 'utf8')
		assert.match(contracts, /"\/moved"/)
		assert.doesNotMatch(contracts, /"\/(first|second)"/)
		assert.equal((await stat(join(root, 'src/routes.gen.data.ts'))).mtimeMs, stamp.getTime())
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

test('generation and runtime grammar agree without executing route modules', async () => {
	const root = await mkdtemp(join(tmpdir(), 'xplat-route-grammar-'))
	try {
		const paths = ['index.tsx', 'items/[id].tsx', '[[locale]]/help.tsx', 'docs/[...rest].tsx', 'help+fade.tsx']
		for (const path of paths) {
			const file = join(root, 'src/app', path)
			await mkdir(join(file, '..'), { recursive: true })
			await writeFile(
				file,
				'throw new Error("Discovery must not execute this module"); export default function Screen() { return null }',
			)
		}
		await generateRoutes(root, 'src/app', undefined, { bake: false })
		const manifest = JSON.parse(await readFile(join(root, 'src/routes.gen.manifest.json'), 'utf8'))
		const actual = manifest.routes.map((route) => routePatternPath(route.path)).sort()
		const expected = paths.map((path) => routePatternPath(path.replace(/(?:\+fade)?\.tsx$/, ''))).sort()
		assert.deepEqual(actual, expected)
		assert.equal(manifest.routes.find(route => route.name === 'help').presentation, 'push')
		assert.equal(manifest.routes.find(route => route.name === 'help').transition, 'fade')
		const types = await readFile(join(root, 'src/routes.gen.contracts.ts'), 'utf8')
		assert.match(types, /id: string/)
		assert.match(types, /locale\?: string/)
		assert.match(types, /'rest'\?: string/)
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

test('file and configured contracts infer together without executing application modules', async () => {
	const root = await mkdtemp(join(tmpdir(), 'xplat-route-contracts-'))
	const workspace = fileURLToPath(new URL('../../../', import.meta.url))
	try {
		await mkdir(join(root, 'src/app/items'), { recursive: true })
		await mkdir(join(root, 'node_modules/@octane-xplat'), { recursive: true })
		await symlink(
			join(workspace, 'packages/ui'),
			join(root, 'node_modules/@octane-xplat/ui'),
			'dir',
		)
		await writeFile(
			join(root, 'xplat.routes.json'),
			JSON.stringify({
				manifests: [{ module: './src/extra.ts', export: 'extra' }],
				context: { module: './src/context.ts', export: 'createContext' },
				transitions: { module: './src/transitions.ts', export: 'transitions' },
				stacks: ['catalog'],
				allowedSchemes: ['pack'],
				allowedOrigins: ['https://app.test'],
				base: '/app',
			}),
		)
		await writeFile(
			join(root, 'src/context.ts'),
			`
throw new Error('Configuration discovery must not execute context');
export function createContext() { return { account: { id: 'a' } } }
`,
		)
		await writeFile(
			join(root, 'src/transitions.ts'),
			`
throw new Error('Configuration discovery must not execute transitions');
export const transitions = { peek: { kind: 'skip' } } as const
`,
		)
		await writeFile(
			join(root, 'src/extra.ts'),
			`
import { defineRoute, defineRoutes } from '@octane-xplat/ui/routing/core'
throw new Error('Configuration discovery must not execute manifests');
export const extra = defineRoutes({
 routes: [defineRoute({ path: '/settings' }).screen(() => null), { path: '/configured-baked', dataMode: 'baked', screen: () => null }],
 baked: { 'configured-baked': { title: 'Prebuilt guide' } },
})
`,
		)
		await writeFile(
			join(root, 'src/app/items/[id].tsx'),
			`
import type { RouteGuardArgs, RouteLoaderArgs, RouteProps } from '../../routes.gen.types'
throw new Error('Configuration discovery must not execute screens');
export function validateSearch(raw: { tab?: unknown }) {
  const tab = raw.tab ?? 'details'
  if (tab !== 'details' && tab !== 'activity') throw new Error('Invalid tab')
  return { tab } as const
}
export function beforeLoad({ params, context }: RouteGuardArgs<'/items/:id'>) {
  return { owner: context.account.id + params.id }
}
export function loader({ params, search, context }: RouteLoaderArgs<'/items/:id'>) {
  return { title: params.id, tab: search.tab, owner: context.owner }
}
export default function Screen(props: RouteProps<'/items/:id'>) {
  const title: string = props.data.title
  const owner: string = props.context.owner
  // @ts-expect-error Screen output follows the inferred loader.
  props.data.invented
  return null
}
`,
		)
		await writeFile(
			join(root, 'consumer.ts'),
			`
import './src/routes.gen.web'
import type { Destination } from '@octane-xplat/ui/routing/core'
import { getRouteApi } from '@octane-xplat/ui/routing'
const configuredBakedTitle: string = getRouteApi('/configured-baked').useLoaderData().title
// @ts-expect-error Generated registration preserves the configured baked DTO.
getRouteApi('/configured-baked').useLoaderData().invented
declare global { interface ImportMeta { glob(...args: unknown[]): Record<string, any> } }
const navigate = (_destination: Destination) => undefined
navigate({ to: '/items/:id', params: { id: 'coat' }, search: { tab: 'activity' }, stack: 'catalog', transition: 'peek' })
navigate({ to: '/settings' })
// @ts-expect-error Missing path params.
navigate({ to: '/items/:id' })
// @ts-expect-error Search values follow the validator output.
navigate({ to: '/items/:id', params: { id: 'coat' }, search: { tab: 'wrong' } })
// @ts-expect-error Wrong programmatic destination.
navigate({ to: '/invented' })
// @ts-expect-error Unregistered flow.
navigate({ to: '/settings', stack: 'invented' })
// @ts-expect-error Unregistered transition.
navigate({ to: '/settings', transition: 'invented' })
`,
		)
		await generateRoutes(root, 'src/app', undefined, { bake: false })
		const catalog = await readFile(join(root, 'src/routes.gen.catalog.web.ts'), 'utf8')
		assert.match(catalog, /from '@octane-xplat\/ui\/routing\/core'/)
		assert.doesNotMatch(catalog, /registerRoutes|configureRouter|routeContext/)
		assert.match(catalog, /configured0/)
		const client = await readFile(join(root, 'src/routes.gen.web.ts'), 'utf8')
		assert.match(client, /configureRouter\(\{/)
		assert.match(client, /context: routeContext/)
		assert.match(client, /transitions: routeTransitions/)
		assert.match(client, /import \{ transitions as routeTransitions \}/)
		assert.match(client, /stacks: \["catalog"\]/)
		assert.match(client, /allowedSchemes: \["pack"\]/)
		assert.match(client, /allowedOrigins: \["https:\/\/app.test"\]/)
		assert.match(client, /base: "\/app"/)
		assert.doesNotMatch(client, /registerRoutes/)
		for (const target of ['ios', 'android', 'mobile', 'macos', 'linux', 'windows']) {
			const source = await readFile(join(root, 'src/routes.gen.' + target + '.ts'), 'utf8')
			assert.match(source, /configureRouter\(\{/)
			assert.match(source, /context: routeContext/)
			assert.match(source, /transitions: routeTransitions/)
			assert.match(source, /stacks: \["catalog"\]/)
		}
		const require = createRequire(join(workspace, 'package.json'))
		const result = spawnSync(
			process.execPath,
			[
				require.resolve('typescript/bin/tsc'),
				'--strict',
				'--skipLibCheck',
				'--noEmit',
				'--module',
				'esnext',
				'--moduleResolution',
				'bundler',
				'--target',
				'ES2020',
				'--jsx',
				'preserve',
				'--allowImportingTsExtensions',
				'consumer.ts',
			],
			{ cwd: root, encoding: 'utf8' },
		)
		assert.equal(result.status, 0, result.stdout + result.stderr)
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

test('separate generated catalogs contribute file and configured contracts in one TypeScript program', async () => {
	const root = await mkdtemp(join(tmpdir(), 'xplat-route-contributions-'))
	const workspace = fileURLToPath(new URL('../../../', import.meta.url))
	try {
		await mkdir(join(root, 'node_modules/@octane-xplat'), { recursive: true })
		await symlink(
			join(workspace, 'packages/ui'),
			join(root, 'node_modules/@octane-xplat/ui'),
			'dir',
		)
		for (const [name, parameter] of [
			['alpha', 'id'],
			['beta', 'slug'],
		]) {
			await mkdir(join(root, 'src', name, name), { recursive: true })
			await writeFile(
				join(root, 'src', name, name, `[${parameter}].tsx`),
				`throw new Error('Discovery must not execute ${name}'); export default function Screen() { return null }`,
			)
			await writeFile(
				join(root, 'src', name + '-extra.ts'),
				`
import { defineRoute, defineRoutes } from '@octane-xplat/ui/routing/core'
throw new Error('Discovery must not execute configured ${name}')
export const routes = defineRoutes([defineRoute({ path: '/${name}-extra' }).screen(() => null)])
`,
			)
			await writeFile(
				join(root, 'xplat.routes.json'),
				JSON.stringify({
					manifests: [{ module: `./src/${name}-extra.ts`, export: 'routes' }],
				}),
			)
			await generateRoutes(root, 'src/' + name, 'src/' + name + '.gen', { bake: false })
		}
		await writeFile(
			join(root, 'consumer.ts'),
			`
import type {} from './src/alpha.gen.types'
import type {} from './src/beta.gen.types'
import { router } from '@octane-xplat/ui/routing'
router.push({ to: '/alpha/:id', params: { id: 'a' } })
router.push({ to: '/beta/:slug', params: { slug: 'b' } })
router.push({ to: '/alpha-extra' })
router.push({ to: '/beta-extra' })
// @ts-expect-error Each module retains its own required params.
router.push({ to: '/beta/:slug', params: { id: 'wrong' } })
// @ts-expect-error The combined registry excludes unknown destinations.
router.push({ to: '/unregistered' })
// @ts-expect-error The combined registry retains required path params.
router.push({ to: '/beta/:slug' })
`,
		)
		const require = createRequire(join(workspace, 'package.json'))
		const checked = spawnSync(
			process.execPath,
			[
				require.resolve('typescript/bin/tsc'),
				'--strict',
				'--skipLibCheck',
				'--noEmit',
				'--module',
				'esnext',
				'--moduleResolution',
				'bundler',
				'--target',
				'ES2020',
				'--jsx',
				'preserve',
				'--allowImportingTsExtensions',
				'consumer.ts',
			],
			{ cwd: root, encoding: 'utf8' },
		)
		assert.equal(checked.status, 0, checked.stdout + checked.stderr)
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

test('reusable catalogs do not register ambient routes until the generated client types are imported', async () => {
	const root = await mkdtemp(join(tmpdir(), 'xplat-route-pure-contracts-'))
	const workspace = fileURLToPath(new URL('../../../', import.meta.url))
	try {
		await mkdir(join(root, 'src/app/items'), { recursive: true })
		await mkdir(join(root, 'node_modules/@octane-xplat'), { recursive: true })
		await symlink(
			join(workspace, 'packages/ui'),
			join(root, 'node_modules/@octane-xplat/ui'),
			'dir',
		)
		await writeFile(
			join(root, 'src/app/items/[id].tsx'),
			`
import type { RouteLoaderArgs, RouteProps } from '../../routes.gen.contracts'
throw new Error('Generation and type checking must not execute screens')
export function loader({ params }: RouteLoaderArgs<'/items/:id'>) { return { title: params.id } }
export default function Screen(props: RouteProps<'/items/:id'>) {
  const title: string = props.data.title
  return null
}
`,
		)
		await writeFile(
			join(root, 'env.d.ts'),
			`
export {}
declare global { interface ImportMeta { glob(...args: unknown[]): Record<string, unknown> } }
`,
		)
		await generateRoutes(root, 'src/app', undefined, { bake: false })
		await writeFile(
			join(root, 'pure.ts'),
			`
import type {} from './env'
import { routes } from './src/routes.gen.catalog.web'
import { createRouter } from '@octane-xplat/ui/routing/core'
import { getRouteApi } from '@octane-xplat/ui/routing'
import type { Destination, RouterHost } from '@octane-xplat/ui/routing/core'
declare const host: RouterHost
const isolated = createRouter({ catalog: routes, host })
isolated.push({ to: '/items/:id', params: { id: 'coat' } })
const title: string = getRouteApi('/items/:id', isolated).useLoaderData().title
// @ts-expect-error Aggregate snapshots may include runtime routes.
isolated.getSnapshot().route?.data.title
// @ts-expect-error Named reads keep inferred file-loader output.
getRouteApi('/items/:id', isolated).useLoaderData().invented
// @ts-expect-error The isolated catalog does not contribute to the default application registry.
const ambient: Destination = { to: '/items/:id', params: { id: 'coat' } }
// @ts-expect-error Local contracts retain required params.
isolated.push({ to: '/items/:id' })
`,
		)
		await writeFile(
			join(root, 'registered.ts'),
			`
import type {} from './env'
import type {} from './src/routes.gen.web'
import { router } from '@octane-xplat/ui/routing'
router.push({ to: '/items/:id', params: { id: 'coat' } })
// @ts-expect-error Generated application registration retains required params.
router.push({ to: '/items/:id' })
`,
		)
		const require = createRequire(join(workspace, 'package.json'))
		for (const consumer of ['pure.ts', 'registered.ts']) {
			const checked = spawnSync(
				process.execPath,
				[
					require.resolve('typescript/bin/tsc'),
					'--strict',
					'--skipLibCheck',
					'--noEmit',
					'--module',
					'esnext',
					'--moduleResolution',
					'bundler',
					'--target',
					'ES2020',
					'--jsx',
					'preserve',
					'--allowImportingTsExtensions',
					consumer,
				],
				{ cwd: root, encoding: 'utf8' },
			)
			assert.equal(checked.status, 0, consumer + '\n' + checked.stdout + checked.stderr)
		}
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

test('programmatic-only apps generate and invalid configuration fails before output', async () => {
	const root = await mkdtemp(join(tmpdir(), 'xplat-route-config-'))
	try {
		await writeFile(
			join(root, 'extra.ts'),
			'throw new Error("must not execute"); export const routes = {}',
		)
		await writeFile(
			join(root, 'xplat.routes.json'),
			JSON.stringify({ manifests: [{ module: './extra.ts', export: 'routes' }] }),
		)
		assert.equal(await generateRoutes(root, undefined, undefined, { bake: false }), 0)
		await writeFile(
			join(root, 'xplat.routes.json'),
			JSON.stringify({ manifests: [{ module: './missing.ts', export: 'routes' }] }),
		)
		await assert.rejects(generateRoutes(root), /manifests\[0\].module: expected an existing/)
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

test('baked Markdown preserves reserved route keys as own JSON data', async () => {
	const root = await mkdtemp(join(tmpdir(), 'xplat-baked-keys-'))
	try {
		await mkdir(join(root, 'src/app'), { recursive: true })
		for (const name of ['__proto__', 'constructor']) {
			await writeFile(join(root, 'src/app', `${name}.md`), '# Reserved route\n\nSafe content.\n')
		}
		await generateRoutes(root, 'src/app')
		const module = await import(pathToFileURL(join(root, 'src/routes.gen.data.ts')).href)
		assert.deepEqual(Object.keys(module.bakedRouteData).sort(), ['__proto__', 'constructor'])
		assert.equal(Object.getPrototypeOf(module.bakedRouteData), Object.prototype)
		assert.equal(typeof module.bakedRouteData.__proto__, 'object')
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

test('emits OS catalogs that exclude shadowed and unavailable route modules', async () => {
	const root = await mkdtemp(join(tmpdir(), 'xplat-route-platforms-'))
	try {
		await mkdir(join(root, 'src/screens'), { recursive: true })
		for (const path of ['detail.tsx', 'detail.mobile.tsrx', 'detail.ios.tsx', 'detail.android.tsx', 'detail.web.tsx', 'detail.linux.tsrx']) {
			await writeFile(join(root, 'src/screens', path), 'globalThis.__xplatRouteGraphHits.push(' + JSON.stringify(path) + '); export function Screen() { return null }')
		}
		await generateRoutes(root, 'src/screens', undefined, { bake: false })
		const catalog = (target) => readFile(join(root, 'src/routes.gen.catalog.' + target + '.ts'), 'utf8')
		const ios = await catalog('ios')
		assert.match(ios, /!\.\/screens\/\*\*\/\*\.android/)
		assert.match(ios, /!\.\/screens\/detail\.tsx/)
		assert.match(ios, /!\.\/screens\/detail\.mobile\.tsrx/)
		assert.match(ios, /deriveRouteManifest\(files, \["ios","mobile"\], "\.\/screens"\)/)
		const android = await catalog('android')
		assert.match(android, /!\.\/screens\/\*\*\/\*\.ios/)
		assert.match(android, /!\.\/screens\/detail\.mobile\.tsrx/)
		const linux = await catalog('linux')
		assert.match(linux, /!\.\/screens\/detail\.web\.tsx/)
		assert.match(linux, /deriveRouteManifest\(files, \["linux","web"\], "\.\/screens"\)/)
		const mobile = await catalog('mobile')
		assert.doesNotMatch(mobile, /Device/)
		assert.match(mobile, /!\.\/screens\/\*\*\/\*\.ios/)
		assert.match(mobile, /!\.\/screens\/\*\*\/\*\.android/)
		const workspace = fileURLToPath(new URL('../../../', import.meta.url))
		await mkdir(join(root, 'node_modules/@octane-xplat'), { recursive: true })
		await symlink(join(workspace, 'packages/ui'), join(root, 'node_modules/@octane-xplat/ui'), 'dir')
		const { build } = await import('vite')
		for (const [target, expected] of Object.entries({ ios: 'detail.ios.tsx', android: 'detail.android.tsx', mobile: 'detail.mobile.tsrx', web: 'detail.web.tsx', linux: 'detail.linux.tsrx', macos: 'detail.tsx', windows: 'detail.tsx' })) {
			const outDir = join(root, 'dist', target)
			await build({
				root, configFile: false, logLevel: 'silent',
				build: { outDir, lib: { entry: join(root, 'src/routes.gen.catalog.' + target + '.ts'), formats: ['es'], fileName: () => 'catalog.mjs' } },
			})
			globalThis.__xplatRouteGraphHits = []
			const { routes } = await import(pathToFileURL(join(outDir, 'catalog.mjs')).href)
			assert.deepEqual(globalThis.__xplatRouteGraphHits, [expected], target + ' must evaluate only its selected screen')
			assert.deepEqual(routes.routes.map((route) => route.name), ['detail'], target + ' preserves the public path in a custom directory')
		}
	} finally {
		delete globalThis.__xplatRouteGraphHits
		await rm(root, { recursive: true, force: true })
	}
})

test('configured source directory wins over conventional directories during automatic generation', async () => {
	const root = await mkdtemp(join(tmpdir(), 'xplat-route-source-'))
	try {
		for (const folder of ['app', 'src/screens']) {
			await mkdir(join(root, folder), { recursive: true })
			await writeFile(join(root, folder, folder === 'app' ? 'wrong.tsx' : 'right.tsx'), 'export function Screen() { return null }')
		}
		await writeFile(join(root, 'xplat.routes.json'), JSON.stringify({ directory: 'src/screens' }))
		assert.equal(await generateRoutes(root, undefined, undefined, { bake: false }), 1)
		const json = JSON.parse(await readFile(join(root, 'src/routes.gen.manifest.json'), 'utf8'))
		assert.deepEqual(json.routes.map((route) => route.name), ['right'])
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

test('baked contracts infer sibling outputs and Markdown without executing loaders', async () => {
	const root = await mkdtemp(join(tmpdir(), 'xplat-baked-contracts-'))
	const workspace = fileURLToPath(new URL('../../../', import.meta.url))
	try {
		await mkdir(join(root, 'src/app'), { recursive: true })
		await mkdir(join(root, 'node_modules/@octane-xplat'), { recursive: true })
		await symlink(
			join(workspace, 'packages/ui'),
			join(root, 'node_modules/@octane-xplat/ui'),
			'dir',
		)

		await symlink(join(workspace, 'node_modules/@types'), join(root, 'node_modules/@types'), 'dir')
		await symlink(
			join(workspace, 'packages/cli/node_modules/vite'),
			join(root, 'node_modules/vite'),
			'dir',
		)

		await writeFile(join(root, 'package.json'), '{"type":"module"}')
		await writeFile(join(root, 'src/app/help.md'), '# Packing\n\n```\nplain code\n```')
		await writeFile(
			join(root, 'src/app/baked.tsx'),
			`
import type { RouteProps } from '../routes.gen.contracts'
export const dataMode = 'baked'
export default function Screen(props: RouteProps<'/baked'>) {
  const title: string = props.data.title
  const count: number = props.data.count
  // @ts-expect-error No fabricated field in the baked output.
  props.data.fabricated
  // @ts-expect-error Data remains numeric after JSON transfer.
  const wrong: string = props.data.count
  return null
}
`,
		)

		await writeFile(
			join(root, 'src/app/baked.loader.ts'),
			`
import { readFileSync } from 'node:fs'
throw new Error('Type generation must not execute the baked loader')
export async function loader() { return { title: readFileSync(new URL('./help.md', import.meta.url), 'utf8'), count: 2 } }
`,
		)

		await writeFile(
			join(root, 'src/app/default.tsx'),
			"export const dataMode = 'baked'; export default function Screen() { return null }",
		)

		await writeFile(
			join(root, 'src/app/default.loader.ts'),
			"throw new Error('Do not execute'); export default function load() { return { enabled: true } }",
		)

		await writeFile(
			join(root, 'consumer.ts'),
			`
import './src/routes.gen.types'
import { getRouteApi } from '@octane-xplat/ui/routing'
import type { RouteProps } from './src/routes.gen.contracts'
function ReadBakedData() {
  const data = getRouteApi('/baked').useLoaderData()
  const count: number = data.count
  // @ts-expect-error Accessors retain the same exact output.
  data.fabricated
  const doc = getRouteApi('/help').useLoaderData()
  const kind: 'octane-xplat/md' = doc.kind
  return null
}
declare const help: RouteProps<'/help'>
const kind: 'octane-xplat/md' = help.data.kind
// @ts-expect-error Markdown exposes a document, not an arbitrary loader output.
help.data.title
declare const fallback: RouteProps<'/default'>
const enabled: boolean = fallback.data.enabled
// @ts-expect-error Default loader output is inferred too.
fallback.data.fabricated
`,
		)

		await generateRoutes(root, 'src/app', undefined, { bake: false })
		const contracts = await readFile(join(root, 'src/routes.gen.contracts.ts'), 'utf8')
		assert.match(contracts, /RouteBakedLoaderData<typeof import\("\.\/app\/baked\.loader\.ts"\)>/)
		const require = createRequire(import.meta.url)
		const checked = spawnSync(
			process.execPath,
			[
				require.resolve('typescript/bin/tsc'),
				'--strict',
				'--skipLibCheck',
				'--noEmit',
				'--module',
				'esnext',
				'--moduleResolution',
				'bundler',
				'--target',
				'ES2022',
				'--types',
				'node',
				'--jsx',
				'preserve',
				'--allowImportingTsExtensions',
				'consumer.ts',
			],
			{ cwd: root, encoding: 'utf8' },
		)

		assert.equal(checked.status, 0, checked.stdout + checked.stderr)
		for (const target of ['web', 'ios', 'android', 'macos', 'linux', 'windows']) {
			const catalog = await readFile(join(root, `src/routes.gen.catalog.${target}.ts`), 'utf8')
			assert.doesNotMatch(catalog, /from\s+['"][^'"]*\.loader\.|import\(['"][^'"]*\.loader\./)
		}

		// Now execute the build, separately from the preceding type-only proof.
		await writeFile(
			join(root, 'src/app/baked.loader.ts'),
			"export async function loader() { return { title: 'Packing', count: 2 } }",
		)

		await writeFile(
			join(root, 'src/app/default.loader.ts'),
			'export default function load() { return { enabled: true } }',
		)

		await generateRoutes(root, 'src/app')
		const dataSource = await readFile(join(root, 'src/routes.gen.data.ts'), 'utf8')
		const data = await import(
			'data:text/javascript,' +
				encodeURIComponent(dataSource.replace(': Record<string, unknown>', ''))
		)

		assert.deepEqual(data.bakedRouteData.baked, { title: 'Packing', count: 2 })
		assert.deepEqual(data.bakedRouteData.default, { enabled: true })
		assert.equal(data.bakedRouteData.help.kind, 'octane-xplat/md')
		await writeFile(
			join(root, 'src/app/baked.loader.ts'),
			'export function loader() { return { nested: undefined } }',
		)

		await assert.rejects(
			generateRoutes(root, 'src/app'),
			/baked route 'baked' \(src\/app\/baked\.loader\.ts\) at \$\["nested"\]: undefined/,
		)

		assert.equal(await readFile(join(root, 'src/routes.gen.data.ts'), 'utf8'), dataSource)
		await rm(join(root, 'src/app/default.loader.ts'))
		await assert.rejects(generateRoutes(root, 'src/app', undefined, { bake: false }), /baked route 'default'.*has no loader sibling/)
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})
