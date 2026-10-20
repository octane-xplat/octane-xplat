#!/usr/bin/env node
// Repeatable routing evaluation for coding agents. Each task starts from the
// packed web starter, gives the agent only the public guides, the starter's
// agent instructions and normal compiler/lint output, then grades the result
// with hidden type fixtures, hidden jsdom tests and static checks.
//
// Self-checks for the harness itself:
//   --mode baseline   untouched starter; every task must fail
//   --mode reference  maintained reference solutions; every task must pass
//
// Usage:
//   node scripts/eval-routing.ts --mode agent --agent 'CMD' [--task ID]... [--trials N]
//   node scripts/eval-routing.ts --mode reference|baseline [--task ID]...
// Options: --base DIR (reuse a packed starter work dir), --out DIR, --timeout MS
// CMD runs through `sh -c` in the task app. Placeholders: {dir}, {prompt_file},
// {prompt} (shell-quoted). It must not receive repository paths or this harness.
import { spawnSync } from 'node:child_process'
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const harness = join(repo, 'scripts/eval-routing')

interface Task {
	id: string
	/** Home-screen markup the reference adds inside the starter's RouteOutlet. */
	referenceLink: string
	/** Import line the reference markup needs in App.tsrx. */
	referenceImport?: string
	/** Generated-manifest and file assertions for structural requirements. */
	manifest?: (routes: ManifestRoute[], app: string) => string | undefined
}

interface ManifestRoute {
	path: string
	guard: boolean
	loader: boolean
}

const tasks: Task[] = [
	{
		id: 'first-route',
		referenceLink: `<NavLink to="/items/:id" params={{ id: 'coat' }}>Open coat</NavLink>`,
	},
	{ id: 'search-sort', referenceLink: `<NavLink to="/items">All items</NavLink>` },
	{
		id: 'protected-account',
		referenceLink: `<NavLink to="/account">Account</NavLink>`,
		manifest: (routes) =>
			routes.find((route) => route.path === 'account')?.guard
				? undefined
				: 'the /account route has no guard export',
	},
	{
		id: 'retry-stock',
		referenceLink: `<NavLink to="/stock/:id" params={{ id: 'coat' }}>Check coat stock</NavLink><StockFeedback />`,
		referenceImport: "import { StockFeedback } from './stock-feedback.tsrx';",
		manifest: (routes) =>
			routes.find((route) => route.path.startsWith('stock'))?.loader
				? undefined
				: 'the /stock/:id route has no loader export',
	},
	{
		id: 'tab-flow',
		referenceLink: '<Sections />',
		referenceImport: "import { Sections } from './sections.tsrx';",
	},
	{
		id: 'guide-routes',
		referenceLink: `<NavLink to="/guides/:slug" params={{ slug: 'setup' }}>Read the setup guide</NavLink>`,
		manifest: (_routes, app) => {
			const config = join(app, 'xplat.routes.json')
			const manifests = existsSync(config)
				? JSON.parse(readFileSync(config, 'utf8')).manifests
				: undefined
			if (!Array.isArray(manifests) || manifests.length === 0) {
				return 'xplat.routes.json declares no programmatic route manifest'
			}
			const fileRoutes = join(app, 'src/app')
			const guideFile = existsSync(fileRoutes)
				? readdirSync(fileRoutes, { recursive: true }).find((path) =>
						String(path).includes('guide'),
					)
				: undefined
			return guideFile
				? `src/app/${String(guideFile)} defines the guide as a file route`
				: undefined
		},
	},
]

const { values } = parseArgs({
	options: {
		mode: { type: 'string', default: 'agent' },
		agent: { type: 'string' },
		task: { type: 'string', multiple: true },
		trials: { type: 'string', default: '1' },
		base: { type: 'string' },
		out: { type: 'string' },
		timeout: { type: 'string', default: String(30 * 60_000) },
		help: { type: 'boolean' },
	},
})

if (values.help) {
	console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\nimport ')[0])
	process.exit(0)
}

const mode = values.mode as 'agent' | 'reference' | 'baseline'
if (!['agent', 'reference', 'baseline'].includes(mode)) {
	throw new Error('--mode must be agent, reference or baseline')
}
if (mode === 'agent' && !values.agent) {
	throw new Error('--mode agent requires --agent CMD')
}
const selected = values.task?.length
	? tasks.filter((task) => values.task!.includes(task.id))
	: tasks
if (values.task?.length && selected.length !== values.task.length) {
	throw new Error('Unknown --task; choose from ' + tasks.map((task) => task.id).join(', '))
}
const trials = mode === 'agent' ? Number(values.trials) : 1
const out = resolve(values.out ?? mkdtempSync(join(tmpdir(), 'xplat-routing-eval-')))
mkdirSync(out, { recursive: true })

function run(command: string, args: string[], cwd: string, timeout = 10 * 60_000, env = {}) {
	const result = spawnSync(command, args, {
		cwd,
		encoding: 'utf8',
		timeout,
		maxBuffer: 256 * 1024 * 1024,
		env: { ...process.env, ...env },
	})
	return {
		ok: result.status === 0 && !result.error,
		status: result.status,
		output: `${result.stdout ?? ''}${result.stderr ?? ''}${result.error ? String(result.error) : ''}`,
	}
}

function baseApp(): string {
	const work = resolve(values.base ?? join(out, 'base'))
	const app = join(work, 'consumer-app')
	if (values.base && existsSync(join(app, 'node_modules'))) {
		return app
	}
	console.log(`[eval] packing and installing the web starter in ${work}`)
	const result = run('node', ['scripts/verify-consumer.ts', '--quick'], repo, 60 * 60_000, {
		VERIFY_CONSUMER_DIR: work,
	})
	writeFileSync(join(out, 'base.log'), result.output)
	if (!result.ok || !existsSync(join(app, 'node_modules'))) {
		throw new Error(`Starter preparation failed; see ${join(out, 'base.log')}`)
	}
	return app
}

const quote = (value: string) => `'${value.replaceAll("'", `'\\''`)}'`

function git(app: string, ...args: string[]) {
	return run('git', ['-c', 'user.name=eval', '-c', 'user.email=eval@example.invalid', ...args], app)
}

function prepare(task: Task, base: string, trial: number) {
	const app = join(out, `${task.id}-${trial}`, 'app')
	rmSync(dirname(app), { recursive: true, force: true })
	mkdirSync(dirname(app), { recursive: true })
	cpSync(base, app, { recursive: true, verbatimSymlinks: true })
	for (const generated of [
		'verify-declarations.ts',
		'verify-declarations.json',
		'verify-source-dev.ts',
	]) {
		rmSync(join(app, generated), { force: true })
	}
	cpSync(join(repo, 'docs'), join(app, '.xplat-docs'), { recursive: true })
	const fixtures = join(harness, 'tasks', task.id, 'fixtures')
	if (existsSync(fixtures)) {
		cpSync(fixtures, app, { recursive: true })
	}
	writeFileSync(join(app, '.gitignore'), 'node_modules\ndist\n')
	git(app, 'init', '-q')
	git(app, 'add', '-A')
	git(app, 'commit', '-q', '-m', 'baseline')
	return app
}

const prompt = (task: Task) =>
	[
		'You are working in an Octane Xplat app in the current directory.',
		'Use only these sources: the app files, AGENTS.md and .agents/skills in this app, the public guides in .xplat-docs/, and the output of `pnpm typecheck`, `pnpm lint`, `pnpm test:web` and `pnpm exec xplat routes`.',
		'Do not search for or read framework source code outside type errors and declarations shown by the compiler.',
		'',
		readFileSync(join(harness, 'tasks', task.id, 'prompt.md'), 'utf8').trim(),
		'',
		'When you finish, write FRICTION.md in the app root. List each place where the guides, type errors, lint output or generated files were confusing, wrong or missing, with the exact text when possible. Write "none" if nothing caused friction.',
	].join('\n')

function applyReference(task: Task, app: string) {
	cpSync(join(harness, 'tasks', task.id, 'reference'), app, { recursive: true })
	const file = join(app, 'src/App.tsrx')
	const source = readFileSync(file, 'utf8')
	const patched = source
		.replace(
			"import { View, HStack, Text, Pressable, ScrollableArea, useColorScheme } from '@octane-xplat/ui';",
			(task.referenceImport ? task.referenceImport + '\n' : '') +
				"import './routes.gen';\nimport { NavLink, RouteOutlet, View, HStack, Text, Pressable, ScrollableArea, useColorScheme } from '@octane-xplat/ui';",
		)
		.replace(
			"\t<View className={['app', dark ? 'dark' : 'light']}>",
			"\t<RouteOutlet><View className={['app', dark ? 'dark' : 'light']}>",
		)
		.replace(
			'<Text className="title">octane-xplat</Text>',
			`<Text className="title">octane-xplat</Text>\n\t\t${task.referenceLink}`,
		)
		.replace(/\t<\/View>\n\}\s*$/, '\t</View></RouteOutlet>\n}\n')
	if (
		patched === source ||
		!patched.includes('</RouteOutlet>') ||
		!patched.includes(task.referenceLink)
	) {
		throw new Error('The reference App patch no longer matches the starter App.tsrx')
	}
	writeFileSync(file, patched)
	const routes = run('pnpm', ['exec', 'xplat', 'routes'], app)
	if (!routes.ok) {
		throw new Error('Reference route generation failed:\n' + routes.output)
	}
}

function runAgent(task: Task, app: string, log: string) {
	const promptFile = join(dirname(app), 'prompt.md')
	const text = prompt(task)
	writeFileSync(promptFile, text)
	const command = values
		.agent!.replaceAll('{dir}', quote(app))
		.replaceAll('{prompt_file}', quote(promptFile))
		.replaceAll('{prompt}', quote(text))
	const started = Date.now()
	const result = run('sh', ['-c', command], app, Number(values.timeout), {
		XPLAT_EVAL_TASK: task.id,
	})
	writeFileSync(log, result.output)
	return { status: result.status, seconds: Math.round((Date.now() - started) / 1000) }
}

interface Check {
	name: string
	pass: boolean
	detail?: string
}

const tail = (text: string) => text.trim().split('\n').slice(-40).join('\n')

function changedSources(app: string): string[] {
	const tracked = git(app, 'diff', '--name-only', 'HEAD').output.split('\n')
	const untracked = git(app, 'ls-files', '--others', '--exclude-standard').output.split('\n')
	return [...new Set([...tracked, ...untracked])].filter(
		(path) =>
			/^src\/.*\.(ts|tsx|tsrx)$/.test(path) &&
			!/\.gen\./.test(path) &&
			!path.startsWith('src/__eval__/') &&
			existsSync(join(app, path)),
	)
}

function readGenerated(app: string) {
	const files = new Map<string, string>()
	const walk = (dir: string) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const path = join(dir, entry.name)
			if (entry.isDirectory()) {
				walk(path)
			} else if (entry.name.includes('.gen.')) {
				files.set(relative(app, path), readFileSync(path, 'utf8'))
			}
		}
	}
	walk(join(app, 'src'))
	return files
}

function grade(task: Task, app: string): Check[] {
	const checks: Check[] = []
	const record = (name: string, pass: boolean, detail?: string) =>
		checks.push({ name, pass, detail })

	const before = readGenerated(app)
	const routes = run('pnpm', ['exec', 'xplat', 'routes'], app)
	const after = readGenerated(app)
	const stale = [...new Set([...before.keys(), ...after.keys()])].filter(
		(path) => before.get(path) !== after.get(path),
	)
	record(
		'generated routes current',
		routes.ok && before.size > 0 && stale.length === 0,
		!routes.ok
			? tail(routes.output)
			: before.size === 0
				? 'no generated route files'
				: stale.join(', '),
	)

	const findings: string[] = []
	for (const path of changedSources(app)) {
		const source = readFileSync(join(app, path), 'utf8')
		for (const [pattern, label] of [
			[/declare\s+module/, 'module augmentation'],
			[/\bas\s+any\b/, 'as any'],
			[/\bas\s+unknown\s+as\b/, 'as unknown as'],
			[/\bas\s+never\b/, 'as never'],
			[/@ts-(ignore|nocheck|expect-error)/, 'compiler suppression'],
		] as const) {
			if (pattern.test(source)) {
				findings.push(`${path}: ${label}`)
			}
		}
	}
	record('no casts, suppressions or augmentation', findings.length === 0, findings.join('\n'))

	const typecheck = run('pnpm', ['exec', 'xplat', 'typecheck'], app)
	record('app typecheck', typecheck.ok, typecheck.ok ? undefined : tail(typecheck.output))
	const lint = run('pnpm', ['exec', 'xplat', 'lint', 'src'], app)
	record('app lint', lint.ok, lint.ok ? undefined : tail(lint.output))

	const manifestPath = join(app, 'src/routes.gen.manifest.json')
	if (task.manifest) {
		const routesJson = existsSync(manifestPath)
			? (JSON.parse(readFileSync(manifestPath, 'utf8')).routes as ManifestRoute[])
			: []
		const problem = task.manifest(routesJson, app)
		record('route structure', !problem, problem)
	}

	const hidden = join(app, 'src/__eval__')
	mkdirSync(hidden, { recursive: true })
	cpSync(join(harness, 'tasks', task.id, 'grader', 'types.eval.ts'), join(hidden, 'types.eval.ts'))
	const contract = run('pnpm', ['exec', 'xplat', 'typecheck'], app)
	record('hidden type contract', contract.ok, contract.ok ? undefined : tail(contract.output))
	rmSync(join(hidden, 'types.eval.ts'))

	cpSync(join(harness, 'grader', 'dom.tsx'), join(hidden, 'dom.tsx'))
	for (const file of readdirSync(join(harness, 'tasks', task.id, 'grader'))) {
		if (file.endsWith('.web.test.tsx')) {
			cpSync(join(harness, 'tasks', task.id, 'grader', file), join(hidden, file))
		}
	}
	const behavior = run(
		'pnpm',
		['exec', 'vitest', 'run', '--config', 'vitest.web.config.mts', 'src/__eval__'],
		app,
	)
	record('hidden runtime behavior', behavior.ok, behavior.ok ? undefined : tail(behavior.output))
	const starter = run(
		'pnpm',
		['exec', 'vitest', 'run', '--config', 'vitest.web.config.mts', 'src/app.web.test.tsx'],
		app,
	)
	record('starter counter test', starter.ok, starter.ok ? undefined : tail(starter.output))
	return checks
}

const base = baseApp()
const results: unknown[] = []
for (const task of selected) {
	for (let trial = 1; trial <= trials; trial++) {
		const app = prepare(task, base, trial)
		let agent: { status: number | null; seconds: number } | undefined
		if (mode === 'reference') {
			applyReference(task, app)
		} else if (mode === 'agent') {
			agent = runAgent(task, app, join(dirname(app), 'agent.log'))
		}
		writeFileSync(join(dirname(app), 'changes.diff'), git(app, 'diff', 'HEAD').output)
		const friction = existsSync(join(app, 'FRICTION.md'))
			? readFileSync(join(app, 'FRICTION.md'), 'utf8').trim()
			: undefined
		const checks = grade(task, app)
		const pass = checks.every((check) => check.pass)
		results.push({ task: task.id, trial, mode, pass, agent, checks, friction })
		console.log(`[eval] ${task.id} #${trial}: ${pass ? 'PASS' : 'FAIL'}`)
		for (const check of checks) {
			console.log(`  ${check.pass ? 'ok  ' : 'FAIL'} ${check.name}`)
		}
	}
}

writeFileSync(
	join(out, 'results.json'),
	JSON.stringify({ schema: 1, mode, results }, null, '\t') + '\n',
)
console.log(`[eval] results: ${join(out, 'results.json')}`)
const passed = results.filter((result) => (result as { pass: boolean }).pass).length
const expectation =
	mode === 'baseline' ? passed === 0 : mode === 'reference' ? passed === results.length : true
console.log(`[eval] ${passed}/${results.length} passed (${mode})`)
process.exit(expectation ? 0 : 1)
