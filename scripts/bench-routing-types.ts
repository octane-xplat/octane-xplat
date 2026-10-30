import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { cpus, tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { generateRoutes } from '../packages/cli/src/commands/routes.ts'

// Manual contributor benchmark, deliberately outside the lightweight PR gate.
// Every sample runs in a separate process so discarded compiler caches cannot
// inflate the following sample's heap or artificially warm its editor program.
const repository = fileURLToPath(new URL('../', import.meta.url))
const args = process.argv.slice(2)
if (args.includes('--help')) {
	console.log(`Usage: bun run bench:routing-types [options]
  --sizes 32,128,512,1024      Total destinations per generated catalog (8–4096)
  --conditions web            Comma-separated web,native,macos,linux,windows
  --ui-package DIRECTORY      Consume declarations from an extracted UI package
  --output FILE               Save versions, timings, counts and memory as JSON
Each sample has a 120-second limit and runs in a fresh process.
This measures TypeScript's language service, not a running editor or target OS.`)

	process.exit(0)
}

function option(name: string, fallback: string): string {
	const index = args.indexOf(name)
	return index < 0 ? fallback : (args[index + 1] ?? '')
}

const uiPackage = resolve(option('--ui-package', join(repository, 'packages/ui')))
const distribution = args.includes('--ui-package') ? 'supplied-package' : 'workspace-declarations'
const id = (index: number) => String(index).padStart(4, '0')
const elapsed = (start: number) => Math.round((performance.now() - start) * 10) / 10

async function fixture(root: string, size: number) {
	const files = Math.floor((size - 4) / 2)
	const programmatic = size - 4 - files
	async function put(path: string, contents: string) {
		await mkdir(dirname(join(root, path)), { recursive: true })
		await writeFile(join(root, path), contents)
	}
	await mkdir(join(root, 'node_modules/@octane-xplat'), { recursive: true })
	await symlink(uiPackage, join(root, 'node_modules/@octane-xplat/ui'), 'dir')
	await put('package.json', JSON.stringify({ private: true, type: 'module' }))
	await put(
		'xplat.routes.json',
		JSON.stringify({
			context: { module: './context.ts', export: 'context' },
			manifests: [{ module: './extra.ts', export: 'extra' }],
		}),
	)
	await put('context.ts', `export const context = { account: { id: 'sample-account' } }\n`)
	await put(
		'search.ts',
		`export function validateSearch(raw: { tab?: unknown; page?: unknown }) {
  const tab = raw.tab ?? 'details'
  if (tab !== 'details' && tab !== 'activity') throw new Error('Invalid tab')
  return { tab, page: Number(raw.page ?? 1) } as const
}\n`,
	)
	for (const path of ['index', 'settings', 'guides/[[section]]', 'assets/[...rest]']) {
		await put(`app/${path}.tsx`, 'export default function Screen() { return null }\n')
	}
	for (let index = 0; index < files; index++) {
		const key = id(index)
		const route = `/files/${key}/:id`
		const baked = index % 16 === 0
		await put(
			`app/files/${key}/[id].tsx`,
			`
import type { RouteGuardArgs, RouteLoaderArgs, RouteProps } from '../../../routes.gen.contracts'
export { validateSearch } from '../../../search'
export function beforeLoad({ params, context }: RouteGuardArgs<'${route}'>) {
  return { owner: context.account.id + params.id }
}
${
	baked
		? "export const dataMode = 'baked'"
		: `export function loader({ params, search, context }: RouteLoaderArgs<'${route}'>) {
  return { title: params.id, detail${key}: search.page, owner: context.owner }
}`
}
export default function Screen(props: RouteProps<'${route}'>) {
  const detail: number = props.data.detail${key}
  const owner: string = props.context.owner
  // @ts-expect-error Generated DTOs must not widen to any.
  props.data.invented
  return null
}\n`,
		)

		if (baked) {
			await put(
				`app/files/${key}/[id].loader.ts`,
				`
throw new Error('The type benchmark must never execute a build-only loader')
export function loader() { return { title: 'Baked item', detail${key}: 1, owner: 'owner' } }\n`,
			)
		}
	}
	await put(
		'extra.ts',
		`
import { defineRoute, defineRoutes } from '@octane-xplat/ui/routing/core'
import { context } from './context'
import { validateSearch } from './search'
const route = defineRoute.withContext<typeof context>()
export const extra = defineRoutes([
${Array.from({ length: programmatic }, (_, index) => {
	const key = id(index)
	return `  route({ path: '/program/${key}/:id', validateSearch,
    beforeLoad: ({ params, context }) => ({ owner: context.account.id + params.id }),
    loader: ({ params, search, context }) => ({ title: params.id, detail${key}: search.page, owner: context.owner }),
  }).screen(({ data, context }) => {
      const detail: number = data.detail${key}
      const owner: string = context.owner
      // @ts-expect-error Inference must preserve this individual route's DTO.
      data.invented
      return null
    }),`
}).join('\n')}
])
`,
	)
	const selected = [
		['files', 0],
		['files', files - 1],
		['program', 0],
		['program', programmatic - 1],
	] as const
	await put(
		'consumer.tsx',
		`
import './routes.gen.types'
import { useRouter, getRouteApi } from '@octane-xplat/ui/routing'
export function Consumer() {
  const navigation = useRouter()
  navigation.push({ to: '/' })
  navigation.push({ to: '/settings' })
${selected
	.map(([kind, index]) => {
		const key = id(index)
		const route = `/${kind}/${key}/:id`
		return `  navigation.push({ to: '${route}', params: { id: 'coat' }, search: { tab: 'activity', page: 2 } })
  { const detail: number = getRouteApi('${route}').useLoaderData().detail${key} }
  { const owner: string = getRouteApi('${route}').useContext().owner }
  // @ts-expect-error Required path params must remain required.
  navigation.push({ to: '${route}' })
  // @ts-expect-error The validator admits a finite set of tabs.
  navigation.push({ to: '${route}', params: { id: 'coat' }, search: { tab: 'invented' } })
  // @ts-expect-error Route-specific loader data must remain precise.
  getRouteApi('${route}').useLoaderData().invented`
	})
	.join('\n')}
  // @ts-expect-error No catch-all string destination after generated registration.
  navigation.push({ to: '/invented' })
  return null
}\n`,
	)
	const lastProgram = `/program/${id(programmatic - 1)}/:id`
	const editor = `
import './routes.gen.types'
import { useRouter, getRouteApi } from '@octane-xplat/ui/routing'
export function Editor() {
  const navigation = useRouter()
  navigation.push({ to: '/*destination*/' })
  const data = getRouteApi('${lastProgram}').useLoaderData()
  data./*property*/
  const title: string = data.title
  return null
}\n`
	const destinationPosition = editor.indexOf('/*destination*/')
	const withoutDestination = editor.replace('/*destination*/', '')
	const propertyPosition = withoutDestination.indexOf('/*property*/')
	const editorSource = withoutDestination.replace('/*property*/', '')
	await put('editor.tsx', editorSource)
	const started = performance.now()
	await generateRoutes(root, 'app', undefined, { bake: false })
	return {
		files,
		programmatic,
		generationMs: elapsed(started),
		editorSource,
		destinationPosition,
		propertyPosition,
		lastKey: id(programmatic - 1),
	}
}

function diagnostics(program: ts.Program) {
	const issues = ts.getPreEmitDiagnostics(program)
	assert.equal(
		issues.length,
		0,
		ts.formatDiagnosticsWithColorAndContext(issues, {
			getCanonicalFileName: (path) => path,
			getCurrentDirectory: () => repository,
			getNewLine: () => '\n',
		}),
	)
}

async function sample(size: number, condition: string) {
	const root =
		option('--fixture-root', '') || (await mkdtemp(join(tmpdir(), 'xplat-routing-types-')))
	let service: ts.LanguageService | undefined
	try {
		const input = await fixture(root, size)
		const options: ts.CompilerOptions = {
			strict: true,
			noEmit: true,
			skipLibCheck: true,
			target: ts.ScriptTarget.ES2020,
			module: ts.ModuleKind.ESNext,
			moduleResolution: ts.ModuleResolutionKind.Bundler,
			jsx: ts.JsxEmit.Preserve,
			customConditions: [condition],
			types: [],
		}

		const declaration = ts.resolveModuleName(
			'@octane-xplat/ui/routing',
			join(root, 'consumer.tsx'),
			options,
			ts.sys,
		).resolvedModule?.resolvedFileName

		const leaf =
			condition === 'macos' ? '.macos' : ['web', 'linux'].includes(condition) ? '.web' : ''

		assert.ok(
			declaration?.endsWith(`/types/generated/routing/index${leaf}.d.ts`),
			`Expected the published routing declaration for ${condition}, received ${declaration}`,
		)

		let started = performance.now()
		const program = ts.createProgram([join(root, 'consumer.tsx')], options)
		diagnostics(program)
		const compileMs = elapsed(started)
		const instantiations = program.getInstantiationCount()
		const types = program.getTypeCount()
		const editorPath = join(root, 'editor.tsx')
		const versions = new Map<string, { version: number; text: string }>()
		const host: ts.LanguageServiceHost = {
			getCompilationSettings: () => options,
			getScriptFileNames: () => [join(root, 'consumer.tsx'), editorPath],
			getScriptVersion: (path) => String(versions.get(path)?.version ?? 0),
			getScriptSnapshot: (path) => {
				const source = versions.get(path)?.text ?? ts.sys.readFile(path)
				return source === undefined ? undefined : ts.ScriptSnapshot.fromString(source)
			},
			getCurrentDirectory: () => root,
			getDefaultLibFileName: ts.getDefaultLibFilePath,
			fileExists: ts.sys.fileExists,
			readFile: ts.sys.readFile,
			readDirectory: ts.sys.readDirectory,
		}

		service = ts.createLanguageService(host)
		function complete(position: number) {
			return service!.getCompletionsAtPosition(editorPath, position, {})?.entries ?? []
		}

		started = performance.now()
		const destinations = complete(input.destinationPosition)
		const coldCompletionMs = elapsed(started)
		assert.equal(
			destinations.length,
			size,
			'Every generated destination must appear in editor completions',
		)

		for (const name of ['/', '/settings', '/files/0000/:id', `/program/${input.lastKey}/:id`]) {
			assert.ok(
				destinations.some((entry) => entry.name === name),
				`Missing completion: ${name}`,
			)
		}

		const warmCompletionMs: number[] = []
		for (let attempt = 0; attempt < 5; attempt++) {
			started = performance.now()
			assert.equal(complete(input.destinationPosition).length, size)
			warmCompletionMs.push(elapsed(started))
		}

		assert.ok(
			complete(input.propertyPosition).some((entry) => entry.name === `detail${input.lastKey}`),
		)

		const titlePosition = input.editorSource.lastIndexOf('title')
		started = performance.now()
		const info = ts.displayPartsToString(
			service.getQuickInfoAtPosition(editorPath, titlePosition)?.displayParts,
		)

		const quickInfoMs = elapsed(started)
		assert.match(info, /title: string/, 'The editor must report the loader property type, not any')
		// Change a real route dependency, rather than timing an irrelevant comment edit.
		const extraPath = join(root, 'extra.ts')
		versions.set(extraPath, {
			version: 1,
			text: (await readFile(extraPath, 'utf8')).replace(
				`detail${input.lastKey}: search.page`,
				`fresh: true, detail${input.lastKey}: search.page`,
			),
		})

		started = performance.now()
		assert.ok(
			complete(input.propertyPosition).some((entry) => entry.name === 'fresh'),
			'An edited loader return must update the generated contract in the editor',
		)

		const editCompletionMs = elapsed(started)
		return {
			size,
			fileRoutes: input.files + 4,
			programmaticRoutes: input.programmatic,
			condition,
			generationMs: input.generationMs,
			compileMs,
			instantiations,
			types,
			coldCompletionMs,
			warmCompletionMs,
			quickInfoMs,
			editCompletionMs,
			peakRssMiB: Math.round(process.resourceUsage().maxRSS / 1024),
			semanticChecks: 'passed',
			destinationCompletions: destinations.length,
		}
	} finally {
		service?.dispose()
		await rm(root, { recursive: true, force: true })
	}
}

if (args.includes('--sample')) {
	console.log(
		JSON.stringify(await sample(Number(option('--sample', '0')), option('--condition', 'web'))),
	)
} else {
	const sizes = option('--sizes', '32,128,512,1024').split(',').map(Number)
	const conditions = option('--conditions', 'web').split(',')
	assert.ok(
		sizes.every((size) => Number.isInteger(size) && size >= 8 && size <= 4096),
		'Sizes must be integers from 8 to 4096',
	)

	assert.ok(
		conditions.every((condition) =>
			['web', 'native', 'macos', 'linux', 'windows'].includes(condition),
		),
		'Unknown package condition',
	)

	const results: Awaited<ReturnType<typeof sample>>[] = []
	for (const condition of conditions) {
		for (const size of sizes) {
			// The parent owns cleanup even if a timed-out worker cannot run finally.
			const root = await mkdtemp(join(tmpdir(), 'xplat-routing-types-'))
			try {
				const child = spawnSync(
					process.execPath,
					[
						fileURLToPath(import.meta.url),
						'--sample',
						String(size),
						'--condition',
						condition,
						'--ui-package',
						uiPackage,
						'--fixture-root',
						root,
					],
					{
						encoding: 'utf8',
						timeout: 120_000,
						maxBuffer: 8 * 1024 * 1024,
					},
				)

				assert.equal(child.status, 0, child.error?.message || child.stderr || child.stdout)
				const result = JSON.parse(child.stdout)
				results.push(result)
				console.log(
					`${condition} ${size} routes: compile ${result.compileMs} ms; editor cold ${result.coldCompletionMs} ms, edit ${result.editCompletionMs} ms; ${result.peakRssMiB} MiB peak RSS`,
				)
			} finally {
				await rm(root, { recursive: true, force: true })
			}
		}
	}

	const report = {
		node: process.version,
		typescript: ts.version,
		platform: process.platform,
		arch: process.arch,
		cpu: cpus()[0]?.model,
		distribution,
		results,
	}

	const output = option('--output', '')
	if (output) {
		await writeFile(output, JSON.stringify(report, null, 2) + '\n')
	}
}
