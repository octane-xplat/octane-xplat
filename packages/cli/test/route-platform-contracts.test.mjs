import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { generateRoutes } from '../dist/commands/routes.js'

const workspace = fileURLToPath(new URL('../../../', import.meta.url))
const require = createRequire(join(workspace, 'packages/ui/package.json'))
const ts = require('typescript')
const { build } = await import('vite')
async function fixture() {
	const root = await mkdtemp(join(tmpdir(), 'xplat-platform-contracts-'))
	await mkdir(join(root, 'node_modules/@octane-xplat'), { recursive: true })
	await symlink(
		resolve(process.env.XPLAT_ROUTING_UI_PACKAGE ?? join(workspace, 'packages/ui')),
		join(root, 'node_modules/@octane-xplat/ui'),
		'dir',
	)
	await symlink(
		dirname(require.resolve('vite/package.json')),
		join(root, 'node_modules/vite'),
		'dir',
	)
	await put(root, 'package.json', '{"private":true,"type":"module"}')
	return root
}

async function put(root, path, source) {
	await mkdir(dirname(join(root, path)), { recursive: true })
	await writeFile(join(root, path), source)
}

function check(root, condition = 'web') {
	const host = ts.createCompilerHost({})
	host.getCurrentDirectory = () => root
	const program = ts.createProgram(
		[join(root, 'consumer.tsx')],
		{
			strict: true,
			noEmit: true,
			skipLibCheck: true,
			allowImportingTsExtensions: true,
			module: ts.ModuleKind.ESNext,
			moduleResolution: ts.ModuleResolutionKind.Bundler,
			target: ts.ScriptTarget.ES2020,
			jsx: ts.JsxEmit.Preserve,
			customConditions: [condition],
			types: ['vite/client'],
		},
		host,
	)
	return ts.getPreEmitDiagnostics(program).map((issue) => ({
		file: issue.file?.fileName,
		text: ts.flattenDiagnosticMessageText(issue.messageText, '\n'),
	}))
}

const screen = 'export default function Screen() { return null }'

test('generated callback checks reject malformed exports before route startup', async () => {
	const root = await fixture()
	try {
		await put(
			root,
			'consumer.tsx',
			`import './routes.gen.types'
import { defineRoute } from '@octane-xplat/ui/routing/core'
// @ts-expect-error Programmatic guards enforce the same return contract.
defineRoute({ path: '/bad-guard', beforeLoad: () => false }).screen(() => null)
// @ts-expect-error Programmatic parsers also require an object result.
defineRoute({ path: '/bad-search', validateSearch: () => 42 }).screen(() => null)
`,
		)

		for (const [field, value] of [
			['group', '{}'],
			['beforeLoad', '"deny"'],
			['beforeLoad', '() => false'],
			['beforeLoad', 'async () => false'],
			['loader', '42'],
			['ErrorBoundary', '{}'],
			['head', '{ title: 42 }'],
			['head', '() => ({ title: 42 })'],
			[
				'validateSearch',
				'{ "~standard": { version: 2, vendor: "fixture", validate: () => ({ value: {} }) } }',
			],
			['validateSearch', '(raw: { page: number }) => raw'],
			['validateSearch', '{} as import("@octane-xplat/ui/routing/core").RouteSearchSchema<{ page: number }, { page: number }>'],
			['validateSearch', '() => 42'],
			['validateSearch', '() => []'],
			['validateSearch', 'async () => []'],
			['validateSearch', '() => new Date()'],
			[
				'validateSearch',
				'{ "~standard": { version: 1 as const, vendor: "fixture", validate: () => ({ value: 42 }) } }',
			],
			[
				'validateSearch',
				'Object.assign(() => ({}), { "~standard": { version: 1 as const, vendor: "fixture", validate: () => ({ value: 42 }) } })',
			],
		]) {
			await put(root, 'app/bad.tsx', `export const ${field} = ${value}\n${screen}`)
			await generateRoutes(root, 'app', undefined, { bake: false })
			for (const condition of ['web', 'native', 'macos', 'linux', 'windows']) {
				const issues = check(root, condition)
				assert.ok(
					issues.some((issue) => issue.file?.endsWith('routes.gen.contracts.ts')),
					`${condition}: ${field} must be diagnosed: ${JSON.stringify(issues)}`,
				)
			}
		}

		await put(root, 'app/bad.tsx', `${screen}\nexport const beforeLoad = undefined`)
		await generateRoutes(root, 'app', undefined, { bake: false })
		assert.deepEqual(check(root), [])
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

test('generated variants reject incompatible loader, search and guard contracts', async () => {
	const root = await fixture()
	try {
		await put(root, 'consumer.tsx', "import './routes.gen.types'\n")
		const cases = [
			[
				'data',
				'export function loader() { return { count: 1 } }',
				"export function loader() { return { title: 'web' } }",
			],
			[
				'search',
				"export function validateSearch(raw: { tab?: unknown }) { return { tab: 'ios' as const } }",
				"export function validateSearch(raw: { tab?: unknown }) { return { tab: 'web' as const } }",
			],
			[
				'searchInput',
				'export function validateSearch(raw: { page: unknown }) { return { page: Number(raw.page) } }',
				'export function validateSearch(raw: { page?: unknown }) { return { page: Number(raw.page ?? 1) } }',
			],
			[
				'context',
				"export function beforeLoad() { return { owner: 'ios' } }",
				'export function beforeLoad() { return { owner: 1 } }',
			],
		]

		for (const [field, ios, web] of cases) {
			await put(root, 'app/item.ios.tsx', ios + '\n' + screen)
			await put(root, 'app/item.web.tsx', web + '\n' + screen)
			await generateRoutes(root, 'app', undefined, { bake: false })
			for (const condition of ['web', 'native', 'macos', 'linux', 'windows']) {
				const issues = check(root, condition)
				assert.ok(
					issues.some(
						(issue) =>
							issue.file?.endsWith('routes.gen.contracts.ts') && issue.text.includes(field),
					),
					`${condition} must diagnose incompatible ${field}: ${JSON.stringify(issues)}`,
				)
			}
		}
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

test('shared calls require availability proof and explicit target catalogs retain their own typed paths', async () => {
	const root = await fixture()
	try {
		await put(root, 'app/index.tsx', screen)
		await put(
			root,
			'app/profile/[id].tsx',
			'export function loader() { return { title: "shared" } }\n' + screen,
		)

		await put(
			root,
			'app/profile/[id].web.tsx',
			'export function loader() { return { title: "web" } }\n' + screen,
		)

		await put(
			root,
			'app/camera.web.tsx',
			'export function loader() { return { photo: "web" } }\n' + screen,
		)

		await put(root, 'app/handset.mobile.tsx', screen)
		await put(root, 'app/devices/[id].tsx', screen)
		await put(root, 'app/devices/camera.web.tsx', screen)
		await put(
			root,
			'app/account.ios.tsx',
			'export function loader() { return { title: "ios" } }\n' + screen,
		)

		await put(
			root,
			'app/account.web.tsx',
			'export function loader() { return { title: "web" } }\n' + screen,
		)

		await put(
			root,
			'extra.ts',
			`import { defineRoute, defineRoutes } from '@octane-xplat/ui/routing/core'
export const extra = defineRoutes([defineRoute({ path: '/configured' }).screen(() => null)])`,
		)

		await put(
			root,
			'xplat.routes.json',
			JSON.stringify({ manifests: [{ module: './extra.ts', export: 'extra' }] }),
		)

		await generateRoutes(root, 'app', undefined, { bake: false })
		await put(
			root,
			'consumer.tsx',
			`
import './routes.gen.types'
import { router, useRouter, getRouteApi, redirect } from '@octane-xplat/ui/routing'
import { NavLink, SideNavItem } from '@octane-xplat/ui'
import { createRouter } from '@octane-xplat/ui/routing/core'
import type { RouterHost } from '@octane-xplat/ui/routing/core'
import { routes as web } from './routes.gen.catalog.web'
import { routes as ios } from './routes.gen.catalog.ios'
import { routes as android } from './routes.gen.catalog.android'
import { routes as mobile } from './routes.gen.catalog.mobile'
import { routes as macos } from './routes.gen.catalog.macos'
import { routes as linux } from './routes.gen.catalog.linux'
import { routes as windows } from './routes.gen.catalog.windows'
declare const host: RouterHost
router.push({ to: '/' })
router.push({ to: '/profile/:id', params: { id: 'coat' } })
router.push({ to: '/configured' })
// @ts-expect-error Shared navigation requires proof for a platform-only file.
router.push({ to: '/camera' })
// @ts-expect-error Href construction uses the same shared contract.
router.href({ to: '/camera' })
// @ts-expect-error Redirects use the same shared contract.
redirect({ to: '/camera' })
// @ts-expect-error Default links cannot promise an exclusive screen.
NavLink({ to: '/camera', children: 'Camera' })
// @ts-expect-error Composed controls cannot bypass the same rule.
SideNavItem({ to: '/camera', label: 'Camera' })
const webRouter = createRouter({ catalog: web, host })
webRouter.push({ to: '/camera' })
NavLink({ router: webRouter, to: '/camera', children: 'Camera' })
const photo: string = getRouteApi('/camera', webRouter).useLoaderData().photo
// @ts-expect-error Target accessors preserve the inferred DTO.
getRouteApi('/camera', webRouter).useLoaderData().invented
const iosRouter = createRouter({ catalog: ios, host })
iosRouter.push({ to: '/handset' })
// @ts-expect-error The iOS catalog excludes the web-only path.
iosRouter.push({ to: '/camera' })
// @ts-expect-error The iOS accessor cannot promise a missing screen.
getRouteApi('/camera', iosRouter)
createRouter({ catalog: android, host }).push({ to: '/handset' })
createRouter({ catalog: mobile, host }).push({ to: '/handset' })
createRouter({ catalog: linux, host }).push({ to: '/camera' })
// @ts-expect-error AppKit excludes the shared handset path.
createRouter({ catalog: macos, host }).push({ to: '/handset' })
// @ts-expect-error Windows excludes the web-only path.
createRouter({ catalog: windows, host }).push({ to: '/camera' })
export async function Controls() {
 const shared = useRouter()
 // @ts-expect-error The default hook also requires proof.
 shared.push({ to: '/camera' })
 const scoped = useRouter(webRouter)
 scoped.push({ to: '/camera' })
 const checked = await router.validateDestination({ to: '/camera' })
 if (checked.status === 'valid') {
   await router.push(checked.destination)
   router.href(checked.destination)
   NavLink({ to: checked.destination, children: 'Camera' })
 }
 return null
}
`,
		)

		for (const condition of ['web', 'native', 'macos', 'linux', 'windows']) {
			assert.deepEqual(check(root, condition), [], condition)
		}

		const metadata = JSON.parse(await readFile(join(root, 'routes.gen.manifest.json'), 'utf8'))
		assert.deepEqual(metadata.routes.find((route) => route.name === 'camera').platforms, [
			'web',
			'linux',
		])

		for (const target of ['web', 'ios', 'android', 'mobile', 'macos', 'linux', 'windows']) {
			await put(
				root,
				`runtime-${target}.ts`,
				`
import { routes } from './routes.gen.catalog.${target}'
import { createRoutePreparation, manifestToJson } from '@octane-xplat/ui/routing/core'
export const metadata = manifestToJson(routes)
export const resolve = createRoutePreparation({ catalog: routes }).resolveUrl
export const prepare = createRoutePreparation({ catalog: routes }).prepare
`,
			)

			const output = join(root, 'out', target)
			await build({
				root,
				configFile: false,
				logLevel: 'silent',
				resolve: { conditions: ['web'] },
				build: {
					outDir: output,
					lib: {
						entry: join(root, `runtime-${target}.ts`),
						formats: ['es'],
						fileName: () => 'runtime.mjs',
					},
				},
			})

			const runtime = await import(pathToFileURL(join(output, 'runtime.mjs')).href)
			assert.deepEqual(runtime.metadata.routes.find((route) => route.name === 'camera').platforms, [
				'web',
				'linux',
			])

			assert.equal(runtime.resolve('/__unknown__').reason, 'pattern')
			assert.equal(runtime.resolve('/devices/other').status, 'matched', target)
			assert.deepEqual(
				runtime.resolve('/handset').status,
				['ios', 'android', 'mobile'].includes(target) ? 'matched' : 'not-found',
				target,
			)

			assert.equal(
				runtime.resolve('/devices/camera').status,
				target === 'web' || target === 'linux' ? 'matched' : 'not-found',
				`${target}: unavailable static metadata wins over an available parameter route`,
			)

			if (target === 'web' || target === 'linux') {
				assert.equal(runtime.resolve('/camera').status, 'matched', target)
				const prepared = await runtime.prepare({ to: '/camera' })
				assert.equal(prepared.status, 'ready', target)
				assert.equal(prepared.match.data.photo, 'web', target)
			} else {
				assert.deepEqual(
					runtime.resolve('/camera'),
					{ status: 'not-found', reason: 'unavailable' },
					target,
				)
			}
		}
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

test('platform variants cannot rename the parameters of one URL pattern', async () => {
	const root = await fixture()
	try {
		await put(root, 'app/items/[id].ios.tsx', screen)
		await put(root, 'app/items/[slug].web.tsx', screen)
		await assert.rejects(
			generateRoutes(root, 'app', undefined, { bake: false }),
			/route\/incompatible-platform-params.*\[id\].*\[slug\]/,
		)
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

test('plain TypeScript and JavaScript helpers do not become phantom screens', async () => {
	const root = await fixture()
	try {
		await put(root, 'app/index.tsx', screen)
		await put(root, 'app/helper.ts', 'export function format() { return "helper" }')
		await put(root, 'app/helper.web.js', 'export default function helper() {}')
		await generateRoutes(root, 'app', undefined, { bake: false })
		const metadata = JSON.parse(await readFile(join(root, 'routes.gen.manifest.json'), 'utf8'))
		assert.deepEqual(
			metadata.routes.map((route) => route.name),
			['index'],
		)

		await put(
			root,
			'consumer.tsx',
			`import './routes.gen.types'
import { router } from '@octane-xplat/ui/routing'
router.push({ to: '/' })
// @ts-expect-error Helpers have no route contract.
router.push({ to: '/helper' })
`,
		)

		assert.deepEqual(check(root), [])
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

test('compatible variants infer local callback arguments without a registry cycle', async () => {
	const root = await fixture()
	try {
		const leaf = `import type { RouteGuardArgs, RouteLoaderArgs, RouteProps } from '../routes.gen.contracts'
export async function validateSearch(raw: { tab?: unknown }) {
 const tab = raw.tab ?? 'details'
 if (tab !== 'details' && tab !== 'activity') throw new Error('Invalid tab')
 return { tab } as const
}
interface GuardedOwner { owner: string }
export async function beforeLoad({ params }: RouteGuardArgs<'/items/:id'>): Promise<GuardedOwner> {
 return { owner: params.id }
}
export function loader({ search, context }: RouteLoaderArgs<'/items/:id'>) {
 return { title: context.owner, tab: search.tab }
}
export default function Screen(props: RouteProps<'/items/:id'>) {
 const owner: string = props.context.owner
 const tab: 'details' | 'activity' = props.data.tab
 // @ts-expect-error Local screen inputs retain precise inferred data.
 props.data.invented
 return null
}`

		await put(root, 'app/[id].tsx', leaf.replaceAll('/items/:id', '/:id'))
		await put(root, 'app/[id].web.tsx', leaf.replaceAll('/items/:id', '/:id'))
		await generateRoutes(root, 'app', undefined, { bake: false })
		await put(
			root,
			'consumer.tsx',
			`import './routes.gen.types'
import { router, getRouteApi } from '@octane-xplat/ui/routing'
router.push({ to: '/:id', params: { id: 'coat' }, search: { tab: 'activity' } })
const title: string = getRouteApi('/:id').useLoaderData().title
// @ts-expect-error The shared destination preserves the validator's finite input.
router.push({ to: '/:id', params: { id: 'coat' }, search: { tab: 'invented' } })
`,
		)

		for (const condition of ['web', 'native', 'macos', 'linux', 'windows']) {
			assert.deepEqual(check(root, condition), [], condition)
		}
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

test('callable schemas retain protocol search types through generated file contracts', async () => {
	const root = await fixture()
	try {
		await put(
			root,
			'app/index.tsx',
			`import { withSearchDecoder, type RouteSearchSchema } from '@octane-xplat/ui/routing/core'
import type { RouteLoaderArgs, RouteProps } from '../routes.gen.contracts'
const schema: RouteSearchSchema<{ page?: number }, { page: number }> = {
 '~standard': { version: 1, vendor: 'fixture', validate: () => ({ value: { page: 1 } }) },
}
export const validateSearch = Object.assign(() => 42, withSearchDecoder(schema, raw => ({ page: Number(raw.page ?? 1) })))
export function loader({ search }: RouteLoaderArgs<'/'>) {
 const page: number = search.page
 // @ts-expect-error A scalar ordinary call does not erase validated search fields.
 search.invented
 return { page }
}
export default function Screen(props: RouteProps<'/'>) {
 const page: number = props.data.page
 return null
}`,
		)

		await generateRoutes(root, 'app', undefined, { bake: false })
		await put(
			root,
			'consumer.tsx',
			`import './routes.gen.types'
import { router, getRouteApi } from '@octane-xplat/ui/routing'
router.push({ to: '/', search: { page: 2 } })
const page: number = getRouteApi('/').useSearch().page
// @ts-expect-error Protocol navigation input remains numeric.
router.push({ to: '/', search: { page: 'two' } })
// @ts-expect-error Ordinary-call output does not become screen data.
const text: string = getRouteApi('/').useLoaderData().page
`,
		)

		for (const condition of ['web', 'native', 'macos', 'linux', 'windows']) {
			assert.deepEqual(check(root, condition), [], condition)
		}
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

test('named interfaces preserve file and programmatic search contracts on every target', async () => {
	const root = await fixture()
	try {
		await put(
			root,
			'app/items/[id].tsx',
			`
export interface Search { tab: 'details' | 'activity'; page: number }
export function validateSearch(raw: { tab?: unknown; page?: unknown }): Search {
  return { tab: raw.tab === 'activity' ? 'activity' : 'details', page: Number(raw.page ?? 1) }
}
export default function Item() { return null }
`,
		)

		await put(
			root,
			'app/schema.tsx',
			`
import { withSearchDecoder, type RouteSearchSchema } from '@octane-xplat/ui/routing/core'
import type { Search } from './items/[id]'
const schema: RouteSearchSchema<{ tab?: 'details' | 'activity'; page?: number }, Search> = { '~standard': { version: 1, vendor: 'named', validate: () => ({ value: { tab: 'details', page: 1 } }) } }
export const validateSearch = withSearchDecoder(schema, raw => ({ tab: raw.tab === 'activity' ? 'activity' : 'details', page: Number(raw.page ?? 1) } as const))
export default function Screen() { return null }
`,
		)

		await generateRoutes(root, 'app', undefined, { bake: false })
		await put(
			root,
			'consumer.tsx',
			`
import './routes.gen.types'
import { defineRoute, defineRoutes, createRouter } from '@octane-xplat/ui/routing/core'
import type { RouterHost } from '@octane-xplat/ui/routing/core'
import type { RouteProps } from './routes.gen.contracts'
import { validateSearch } from './app/items/[id]'
const props = undefined as unknown as RouteProps<'/items/:id'>
const tab: 'details' | 'activity' = props.search.tab
const page: number = props.search.page
const schema = undefined as unknown as RouteProps<'/schema'>
const schemaTab: 'details' | 'activity' = schema.search.tab
const schemaPage: number = schema.search.page
// @ts-expect-error Generated named output is not any or never.
const impossible: never = props.search
const definition = defineRoute({ path: '/programmatic', validateSearch, loader: ({ search }) => search.page })
definition.screen(({ search, data }) => { const tab: 'details' | 'activity' = search.tab; const page: number = data; return null })
const navigation = createRouter({ catalog: defineRoutes([definition.screen(() => null)]), host: undefined as unknown as RouterHost })
navigation.push({ to: '/programmatic', search: { tab: 'activity', page: 2 } })
// @ts-expect-error Programmatic named search retains literal values.
navigation.push({ to: '/programmatic', search: { tab: 'invented' } })
`,
		)

		for (const condition of ['web', 'native', 'macos', 'linux', 'windows']) {
			assert.deepEqual(check(root, condition), [], condition)
		}
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

test('generated file routes inherit parent group data without requiring it as root context', async () => {
	const root = await fixture()
	try {
		await put(root, 'scopes.ts', `import { defineRouteGroup } from '@octane-xplat/ui/routing/core'
export const account = defineRouteGroup({ id: 'account', loader: () => ({ name: 'Alex' }) })
export const project = account.group({ id: 'project', loader: ({ context }) => ({ owner: context.account.name }) })`)
		await put(root, 'app/item.tsx', `export { project as group } from '../scopes'
import type { RouteHeadArgs, RouteGuardArgs, RouteLoaderArgs, RouteProps } from '../routes.gen.contracts'
export function beforeLoad({ context }: RouteGuardArgs<'/item'>) {
 const owner: string = context.project.owner
 return { owner }
}
export function loader({ context }: RouteLoaderArgs<'/item'>) { return context.account.name + context.owner }
export function head({ params, search, context, data }: RouteHeadArgs<'/item'>) {
 const title: string = data
 const owner: string = context.project.owner
 // @ts-expect-error Metadata keeps precise loader output.
 data.invented
 // @ts-expect-error This route declares no path values.
 params.invented
 // @ts-expect-error This route declares no search fields.
 search.invented
 return { title, meta: { owner } }
}
export default function Screen(props: RouteProps<'/item'>) {
 const owner: string = props.context.project.owner
 const title: string = props.data
 // @ts-expect-error Parent data is inferred.
 props.context.account.invented
 return null
}`)
		await generateRoutes(root, 'app', undefined, { bake: false })
		await put(root, 'consumer.tsx', `import './routes.gen.types'
import { createRouter } from '@octane-xplat/ui/routing/core'
import type { RouterHost } from '@octane-xplat/ui/routing/core'
import { routes } from './routes.gen.catalog.web'
createRouter({ catalog: routes, host: undefined as unknown as RouterHost })`)
		for (const condition of ['web', 'native', 'macos', 'linux', 'windows']) {
			assert.deepEqual(check(root, condition), [], condition)
		}
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})
