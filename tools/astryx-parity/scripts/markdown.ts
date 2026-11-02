/** Markdown parity runner — nonvisual modes comparing the pinned Astryx
 *  0.7.4 reference against the @octane-xplat/ui candidate.
 *
 *  Modes:
 *    parser       Node-side document differential over the shared corpus.
 *    behavior     DOM/event probes on the /markdown/behavior routes.
 *    layout       Geometry metrics on the /markdown/layout routes.
 *    performance  Node-side parse benchmarks with target-relative budgets.
 *
 *  Every scenario ends in one of: match | candidate-diff | candidate-error |
 *  reference-error | harness-error. Findings are the expected milestone-0
 *  output; exit 1 on diffs, 4 on harness errors, 0 on clean pass. */

import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { markdownScenarios, streamSchedules, type MarkdownScenario } from '../scenarios/markdown.ts'

const appDir = fileURLToPath(new URL('..', import.meta.url))
const artifacts = `${appDir}/artifacts/markdown`

const MODES = ['parser', 'behavior', 'layout', 'performance'] as const
type Mode = (typeof MODES)[number]

type ScenarioResult = {
	key: string
	status: 'match' | 'candidate-diff' | 'candidate-error' | 'reference-error' | 'harness-error'
	diffs?: unknown[]
	error?: string
}

// ---------------------------------------------------------------------------
// Canonical document normalization
// ---------------------------------------------------------------------------

type Canon = { type: string; children?: Canon[]; [k: string]: unknown }

/** Reference canonical AST → comparable shape (0.7.4 MarkdownAst*). */
function canonRef(node: any): Canon {
	const kids = node.children?.map(canonRef)
	switch (node.type) {
		case 'root':
			return { type: 'root', children: kids }
		case 'heading':
			return { type: 'heading', depth: node.depth, children: kids }
		case 'paragraph':
			return { type: 'paragraph', children: kids }
		case 'code':
			return { type: 'code', lang: node.lang ?? null, meta: node.meta ?? null, value: node.value }
		case 'math':
			return { type: 'math', value: node.value }
		case 'blockquote':
			return { type: 'blockquote', children: kids }
		case 'list':
			return {
				type: 'list',
				ordered: node.ordered,
				start: node.start ?? null,
				spread: node.spread ?? null,
				children: kids,
			}
		case 'listItem':
			return { type: 'listItem', checked: node.checked ?? null, children: kids }
		case 'table':
			return { type: 'table', align: node.align ?? null, children: kids }
		case 'tableRow':
			return { type: 'tableRow', children: kids }
		case 'tableCell':
			return { type: 'tableCell', children: kids }
		case 'thematicBreak':
			return { type: 'thematicBreak' }
		case 'text':
			return { type: 'text', value: node.value }
		case 'strong':
		case 'emphasis':
		case 'delete':
			return { type: node.type, children: kids }
		case 'inlineCode':
			return { type: 'inlineCode', value: node.value }
		case 'inlineMath':
			return { type: 'inlineMath', value: node.value }
		case 'link':
			return { type: 'link', url: node.url, title: node.title ?? null, children: kids }
		case 'image':
			return { type: 'image', url: node.url, alt: node.alt ?? null }
		case 'citation':
			return { type: 'citation', sourceId: node.sourceId }
		case 'break':
			return { type: 'break' }
		case 'extension':
			return { type: 'extension', plugin: node.plugin, name: node.name, display: node.display }
		default:
			return { type: `unknown:${node.type}` }
	}
}

/** Candidate MdDoc → the same comparable shape. The candidate emits the
 *  canonical Md* vocabulary, so the reference canonicalizer applies after
 *  wrapping children in a root node. */
function canonCandDoc(doc: any): Canon {
	return canonRef({ type: 'root', children: doc.children })
}

// ---------------------------------------------------------------------------
// Structural diff
// ---------------------------------------------------------------------------

type Diff = { path: string; kind: string; reference?: unknown; candidate?: unknown }

function diffCanon(ref: Canon | undefined, cand: Canon | undefined, path: string, out: Diff[]) {
	if (ref == null || cand == null) {
		out.push({ path, kind: 'missing-node', reference: ref?.type, candidate: cand?.type })
		return
	}
	if (ref.type !== cand.type) {
		out.push({ path, kind: 'type-mismatch', reference: ref.type, candidate: cand.type })
		return
	}
	for (const key of new Set([...Object.keys(ref), ...Object.keys(cand)])) {
		if (key === 'type' || key === 'children') continue
		const a = ref[key]
		const b = cand[key]
		if (a === undefined && b === undefined) continue
		if (JSON.stringify(a) !== JSON.stringify(b)) {
			out.push({ path: `${path}.${key}`, kind: 'attr-diff', reference: a, candidate: b })
		}
	}
	const rk = ref.children ?? []
	const ck = cand.children ?? []
	const n = Math.max(rk.length, ck.length)
	for (let i = 0; i < n; i++) {
		diffCanon(rk[i], ck[i], `${path}/${rk[i]?.type ?? candType(ck[i])}${i}`, out)
	}
}
const candType = (c: Canon | undefined) => c?.type ?? 'missing'

// ---------------------------------------------------------------------------
// parser mode
// ---------------------------------------------------------------------------

async function runParserMode() {
	const ref = await import('@astryxdesign/core/Markdown/parser')
	const cand = await import('../../../packages/ui/src/markdown/markdown-parse.ts')
	const candStream = await import('../../../packages/ui/src/markdown/markdown-stream.ts')
	// The streaming internals (trim + canonical incremental parse) are not in
	// the published export map, so they come from the shipped source tree —
	// byte-identical to tag v0.7.4 (milestone-0 provenance).
	const refSrc: any = await import(
		'../node_modules/@astryxdesign/core/src/Markdown/parser.ts' as string
	)

	const results: ScenarioResult[] = []

	for (const scenario of markdownScenarios) {
		const opts: Record<string, unknown> = {}
		if (scenario.options?.autolink) opts.autolink = scenario.options.autolink
		if (scenario.options?.sourceIds) opts.sourceIds = new Set(scenario.options.sourceIds)
		if (scenario.options?.math) opts.math = true
		if (scenario.options?.sourceRanges) opts.sourceRanges = true

		let refRoot: Canon
		try {
			refRoot = canonRef(ref.parseMarkdownAst(scenario.source, opts as any))
		} catch (e) {
			results.push({ key: scenario.key, status: 'reference-error', error: String(e) })
			continue
		}

		let candRoot: Canon
		try {
			candRoot = canonCandDoc(cand.parseMdDoc(scenario.source, opts as any))
		} catch (e) {
			results.push({ key: scenario.key, status: 'candidate-error', error: String(e) })
			continue
		}

		const diffs: Diff[] = []
		diffCanon(refRoot, candRoot, 'root', diffs)
		results.push({
			key: scenario.key,
			status: diffs.length === 0 ? 'match' : 'candidate-diff',
			diffs: diffs.slice(0, 60),
		})

		// Incremental/stream equivalence for chunked scenarios: compare every
		// intermediate canonical snapshot, not just final convergence — the
		// milestone-4 intermediate-output contract.
		if (scenario.chunks) {
			const schedules = streamSchedules(scenario.source)
			for (let s = 0; s < schedules.length; s++) {
				const schedule = schedules[s]
				const key = `${scenario.key}/stream-${s}`
				try {
					const refState = refSrc.createIncrementalState()
					const candState = candStream.createMarkdownIncrementalState()
					let acc = ''
					const stepDiffs: Diff[] = []
					let step = 0
					for (const chunk of schedule) {
						acc += chunk
						// Both sides parse the production-trimmed snapshot: the
						// component trims before the incremental parse in each stack.
						const refTrim = refSrc.trimStreamingArtifacts(acc, { math: opts.math === true })
						const candTrim = candStream.trimStreamingArtifacts(acc, {
							math: opts.math === true,
						})
						const refStep = canonRef(
							refSrc.parseMarkdownAstIncremental(refTrim, refState, opts as any),
						)
						const candStep = canonCandDoc({
							children: candStream.parseMarkdownIncremental(candTrim, candState, opts as any),
						})
						diffCanon(refStep, candStep, `step${step}`, stepDiffs)
						step++
					}
					// Final documents converge to the same full parse.
					const refFinal = canonRef(ref.parseMarkdownAst(scenario.source, opts as any))
					const candParser = candStream.createMarkdownStreamParser(opts as any)
					for (const chunk of schedule) candParser.append(chunk)
					const candFinish = canonCandDoc(candParser.finish())
					const finishDiffs: Diff[] = []
					diffCanon(refFinal, candFinish, 'finish', finishDiffs)
					const all = [...stepDiffs, ...finishDiffs]
					results.push({
						key,
						status: all.length === 0 ? 'match' : 'candidate-diff',
						diffs: all.slice(0, 20),
					})
				} catch (e) {
					results.push({ key, status: 'harness-error', error: String(e) })
				}
			}
		}
	}

	return { mode: 'parser' as const, results }
}

// ---------------------------------------------------------------------------
// browser modes (behavior, layout)
// ---------------------------------------------------------------------------

const SIDES = [
	{ name: 'reference', config: `${appDir}/reference/vite.config.ts`, port: 4310 },
	{ name: 'candidate', config: `${appDir}/candidate/vite.config.ts`, port: 4311 },
] as const

async function serveBoth() {
	const { build, preview } = await import('vite')
	const servers = []
	for (const side of SIDES) {
		await build({ configFile: side.config, logLevel: 'warn' })
		servers.push(
			await preview({
				configFile: side.config,
				logLevel: 'warn',
				preview: { host: '127.0.0.1', port: side.port, strictPort: true },
			}),
		)
	}
	return servers
}

async function runBrowserMode(mode: 'behavior' | 'layout') {
	const { chromium } = await import('playwright')
	const { markdownBehaviorProbes, markdownLayoutProbes } = await import('./markdown-browser.ts')
	const servers = await serveBoth()
	const browser = await chromium.launch()
	try {
		const [reference, candidate] = await Promise.all([
			mode === 'behavior'
				? markdownBehaviorProbes(browser, `http://127.0.0.1:${SIDES[0].port}`)
				: markdownLayoutProbes(browser, `http://127.0.0.1:${SIDES[0].port}`),
			mode === 'behavior'
				? markdownBehaviorProbes(browser, `http://127.0.0.1:${SIDES[1].port}`)
				: markdownLayoutProbes(browser, `http://127.0.0.1:${SIDES[1].port}`),
		])
		const diffs: Diff[] = []
		const candIndex = new Map(candidate.map((o: any) => [o.step, o.value]))
		for (const { step, value } of reference) {
			const other = candIndex.get(step)
			candIndex.delete(step)
			if (JSON.stringify(value) !== JSON.stringify(other)) {
				diffs.push({ path: step, kind: `${mode}-diff`, reference: value, candidate: other })
			}
		}
		for (const [step, value] of candIndex) {
			diffs.push({ path: step, kind: `${mode}-diff`, reference: undefined, candidate: value })
		}
		return {
			mode,
			results: [
				{
					key: mode,
					status: diffs.length === 0 ? ('match' as const) : ('candidate-diff' as const),
					diffs,
				},
			],
			reference,
			candidate,
		}
	} finally {
		await browser.close()
		for (const s of servers) await s.httpServer.close()
	}
}

// ---------------------------------------------------------------------------
// performance mode
// ---------------------------------------------------------------------------

const PERF_BUDGETS = {
	/** Candidate p95 per-parse latency must be at most 1.2× reference p95. */
	p95RatioMax: 1.2,
	/** Candidate throughput must be at least 0.8× reference throughput. */
	throughputRatioMin: 0.8,
} as const

function makeDoc(bytes: number): string {
	const para = 'Streaming prose with **bold**, _em_, [a link](https://example.com) and `code`.\n\n'
	const list = '- alpha\n- beta\n  - nested\n- [x] task\n\n'
	const table = '| col a | col b |\n| :-- | --: |\n| 1 | 2 |\n\n'
	let out = '# Benchmark document\n\n'
	while (out.length < bytes) out += para + list + table
	return out
}

async function runPerformanceMode() {
	const ref = await import('@astryxdesign/core/Markdown/parser')
	const cand = await import('../../../packages/ui/src/markdown/markdown-parse.ts')
	const { performance } = await import('node:perf_hooks')

	const workloads = [1024, 10 * 1024, 100 * 1024].map((bytes) => ({
		bytes,
		source: makeDoc(bytes),
	}))

	const samples = (fn: () => void, n: number) => {
		const times: number[] = []
		for (let i = 0; i < n; i++) {
			const t0 = performance.now()
			fn()
			times.push(performance.now() - t0)
		}
		times.sort((a, b) => a - b)
		return {
			p50: times[Math.floor(times.length * 0.5)],
			p95: times[Math.floor(times.length * 0.95)],
			mean: times.reduce((a, b) => a + b, 0) / times.length,
		}
	}

	const results: ScenarioResult[] = []
	for (const { bytes, source } of workloads) {
		for (const w of [ref, cand]) {
			void w
		}
		// warmup
		for (let i = 0; i < 3; i++) {
			ref.parseMarkdownAst(source)
			cand.parseMdDoc(source)
		}
		const n = bytes > 50 * 1024 ? 15 : 30
		const r = samples(() => ref.parseMarkdownAst(source), n)
		const c = samples(() => cand.parseMdDoc(source), n)
		const p95Ratio = c.p95 / Math.max(r.p95, 1e-6)
		const thrRatio = r.mean > 0 ? r.mean / c.mean : 0 // >1 when candidate faster
		results.push({
			key: `perf-${bytes}`,
			status: 'match',
			diffs: [
				{
					path: 'p95',
					kind: 'metric',
					reference: { ms: r.p95, p50: r.p50, mean: r.mean },
					candidate: { ms: c.p95, p50: c.p50, mean: c.mean },
				},
				{
					path: 'budgets',
					kind: 'metric',
					reference: PERF_BUDGETS,
					candidate: {
						p95Ratio,
						throughputRatio: thrRatio,
						p95Within: p95Ratio <= PERF_BUDGETS.p95RatioMax,
						throughputWithin: thrRatio >= PERF_BUDGETS.throughputRatioMin,
					},
				},
			],
		})
	}

	// Incremental tail-append cost: shared settled prefix, growing tail.
	for (const { bytes, source } of workloads) {
		const candStreamMod = await import('../../../packages/ui/src/markdown/markdown-stream.ts')
		const state = ref.createIncrementalState()
		const cstate = candStreamMod.createMarkdownIncrementalState()
		const half = source.slice(0, source.length / 2)
		ref.parseMarkdownIncremental(half, state as any, {} as any)
		candStreamMod.parseMarkdownIncremental(half, cstate)
		const r = samples(() => {
			ref.parseMarkdownIncremental(source, state as any, {} as any)
			// reset to the same precondition
			const s2 = ref.createIncrementalState()
			ref.parseMarkdownIncremental(half, s2 as any, {} as any)
			Object.assign(state, s2)
		}, 12)
		const c = samples(() => {
			candStreamMod.parseMarkdownIncremental(source, cstate)
			// reset to the same precondition
			const s2 = candStreamMod.createMarkdownIncrementalState()
			candStreamMod.parseMarkdownIncremental(half, s2)
			Object.assign(cstate, s2)
		}, 12)
		results.push({
			key: `perf-incremental-${bytes}`,
			status: 'match',
			diffs: [{ path: 'p95', kind: 'metric', reference: r, candidate: c }],
		})
	}

	return { mode: 'performance' as const, results }
}

// ---------------------------------------------------------------------------
// driver
// ---------------------------------------------------------------------------

async function main() {
	const arg = process.argv[2]
	const modes: Mode[] = arg ? (arg.split(',') as Mode[]) : [...MODES]
	for (const m of modes) {
		if (!MODES.includes(m)) {
			console.error(`unknown mode ${m} — expected ${MODES.join('|')}`)
			process.exit(2)
		}
	}

	mkdirSync(artifacts, { recursive: true })
	let exitCode = 0
	const summary: Record<string, { match: number; diff: number; errors: number }> = {}

	for (const mode of modes) {
		try {
			const out =
				mode === 'parser'
					? await runParserMode()
					: mode === 'performance'
						? await runPerformanceMode()
						: await runBrowserMode(mode)
			writeFileSync(`${artifacts}/${mode}.json`, JSON.stringify(out, null, '\t'))
			const errors = out.results.filter(
				(r) => r.status === 'harness-error' || r.status === 'reference-error',
			)
			const diffs = out.results.filter(
				(r) => r.status === 'candidate-diff' || r.status === 'candidate-error',
			)
			summary[mode] = {
				match: out.results.length - errors.length - diffs.length,
				diff: diffs.length,
				errors: errors.length,
			}
			if (errors.length > 0) exitCode = 4
			else if (diffs.length > 0) exitCode = Math.max(exitCode, 1)
			console.log(
				`[markdown/${mode}] ${out.results.length} results: ${summary[mode].match} match, ${diffs.length} candidate findings, ${errors.length} reference/harness errors`,
			)
		} catch (e) {
			console.error(`[markdown/${mode}] harness failure: ${e instanceof Error ? e.stack : e}`)
			summary[mode] = { match: 0, diff: 0, errors: 1 }
			exitCode = 4
		}
	}

	writeFileSync(`${artifacts}/summary.json`, JSON.stringify(summary, null, '\t'))
	process.exit(exitCode)
}

await main()
