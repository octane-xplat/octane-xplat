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
import {
  markdownScenarios,
  mentionsContribution,
  mentionsToText,
  streamSchedules,
  type MarkdownScenario,
} from '../scenarios/markdown.ts'

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
      return { type: 'root', data: node.data ?? null, children: kids }
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
      return {
        type: 'extension',
        plugin: node.plugin,
        name: node.name,
        display: node.display,
        data: node.data ?? null,
      }
    default:
      return { type: `unknown:${node.type}` }
  }
}

/** Candidate MdDoc → the same comparable shape. The candidate emits the
 *  canonical Md* vocabulary, so the reference canonicalizer applies after
 *  wrapping children in a root node. */
function canonCandDoc(doc: any): Canon {
  return canonRef({ type: 'root', data: doc.data, children: doc.children })
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
    if (key === 'type' || key === 'children') {
      continue
    }

    const a = ref[key]
    const b = cand[key]

    if (a === undefined && b === undefined) {
      continue
    }

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

/** Named plugin profiles resolved to each side's real first-party entries —
 *  `createMarkdownFrontmatter` gets the same `{name:'meta', parse: fields =>
 *  fields}` decoder on both so doc.data envelopes compare verbatim. */
function pluginEntries(mod: any, scenario: MarkdownScenario): unknown[] | undefined {
  const profiles = scenario.options?.plugins

  if (profiles == null) {
    return undefined
  }

  return profiles.map((p) => {
    switch (p) {
      case 'soft-breaks':
        return mod.markdownSoftBreaksPlugin
      case 'frontmatter':
        return mod.createMarkdownFrontmatter({ name: 'meta', parse: (fields: any) => fields })
          .plugin
      case 'source-lines':
        return mod.markdownSourceLinesPlugin
      case 'heading-links':
        return mod.createMarkdownHeadingLinks({ permalinkBaseUrl: 'https://docs.example' })
      case 'mentions':
        return mod.createMarkdownPlugin({
          name: 'mentions',
          apiVersion: 1,
          parseKey: 'mentions@1',
          syntax: { inline: [mentionsContribution] },
          renderers: { mention: { render: () => null, toText: mentionsToText } },
        })
    }
  })
}

async function runParserMode() {
  const ref = await import('@astryxdesign/core/Markdown/parser')
  const refPlugins = await import('@astryxdesign/core/Markdown/plugins')
  const cand = await import('../../../packages/ui/src/markdown/markdown-parse.ts')
  const candStream = await import('../../../packages/ui/src/markdown/markdown-stream.ts')
  const candHelpers = await import('../../../packages/ui/src/markdown/markdown-plugin-helpers.ts')
  const candProtocol = await import('../../../packages/ui/src/markdown/markdown-plugins.ts')
  const candPluginEntries = {
    ...candHelpers,
    createMarkdownPlugin: candProtocol.createMarkdownPlugin,
  }

  // The streaming internals (trim + canonical incremental parse) are not in
  // the published export map, so they come from the shipped source tree —
  // byte-identical to tag v0.7.4 (milestone-0 provenance).
  const refSrc: any = await import(
    '../node_modules/@astryxdesign/core/src/Markdown/parser.ts' as string
  )

  const results: ScenarioResult[] = []

  for (const scenario of markdownScenarios) {
    const opts: Record<string, unknown> = {}

    if (scenario.options?.autolink) {
      opts.autolink = scenario.options.autolink
    }

    if (scenario.options?.sourceIds) {
      opts.sourceIds = new Set(scenario.options.sourceIds)
    }

    if (scenario.options?.math) {
      opts.math = true
    }

    if (scenario.options?.sourceRanges) {
      opts.sourceRanges = true
    }

    const candOpts: Record<string, unknown> = { ...opts }

    if (scenario.options?.plugins != null) {
      // Full entries on both sides — each parser applies transforms internally.
      opts.plugins = pluginEntries(refPlugins, scenario)
      candOpts.plugins = pluginEntries(candPluginEntries, scenario)
    }

    // pluginsAt: stream steps before the index run without plugins; the
    // config flips mid-stream and the settled prefix must invalidate.
    const pluginsAt = scenario.options?.pluginsAt
    const stepOpts = (step: number) =>
      pluginsAt != null && step < pluginsAt ? { ...opts, plugins: undefined } : opts

    const stepCandOpts = (step: number) =>
      pluginsAt != null && step < pluginsAt ? { ...candOpts, plugins: undefined } : candOpts

    let refRoot: Canon

    try {
      refRoot = canonRef(ref.parseMarkdownAst(scenario.source, opts as any))
    } catch (e) {
      results.push({ key: scenario.key, status: 'reference-error', error: String(e) })
      continue
    }

    let candRoot: Canon

    try {
      candRoot = canonCandDoc(cand.parseMdDoc(scenario.source, candOpts as any))
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

            // The schedule's final step always sees the full option set so
            // pluginsAt flips mid-stream on every replayed schedule.
            const so = stepOpts(step === schedule.length - 1 ? Number.MAX_SAFE_INTEGER : step)
            const sco = stepCandOpts(step === schedule.length - 1 ? Number.MAX_SAFE_INTEGER : step)
            // Both sides parse the production-trimmed snapshot: the
            // component trims before the incremental parse in each stack.
            const refTrim = refSrc.trimStreamingArtifacts(acc, { math: opts.math === true })
            const candTrim = candStream.trimStreamingArtifacts(acc, {
              math: opts.math === true,
            })

            const refStep = canonRef(
              refSrc.parseMarkdownAstIncremental(refTrim, refState, so as any),
            )

            const candStep = canonCandDoc(
              candStream.parseMarkdownIncremental(candTrim, candState, sco as any),
            )

            diffCanon(refStep, candStep, `step${step}`, stepDiffs)
            step++
          }

          // Final documents converge to the same full parse.
          const refFinal = canonRef(ref.parseMarkdownAst(scenario.source, opts as any))
          const candParser = candStream.createMarkdownStreamParser(candOpts as any)

          for (const chunk of schedule) {
            candParser.append(chunk)
          }

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

      // Simultaneous streams: two independent incremental states
      // interleaved in one process must not contaminate each other.
      try {
        const ra = refSrc.createIncrementalState()
        const rb = refSrc.createIncrementalState()
        const ca = candStream.createMarkdownIncrementalState()
        const cb = candStream.createMarkdownIncrementalState()
        const half = Math.floor(scenario.source.length / 2)
        const diffs: Diff[] = []
        let accA = ''

        for (const [i, chunk] of [
          scenario.source.slice(0, half),
          scenario.source.slice(half),
        ].entries()) {
          accA += chunk
          diffCanon(
            canonRef(refSrc.parseMarkdownAstIncremental(accA, ra, opts as any)),
            canonCandDoc(candStream.parseMarkdownIncremental(accA, ca, candOpts as any)),
            `a${i}`,
            diffs,
          )
        }

        // B accumulates the halves in reverse order — a different
        // document that both sides must still parse identically.
        let accB = ''

        for (const [i, chunk] of [
          scenario.source.slice(half),
          scenario.source.slice(0, half),
        ].entries()) {
          accB += chunk
          diffCanon(
            canonRef(refSrc.parseMarkdownAstIncremental(accB, rb, opts as any)),
            canonCandDoc(candStream.parseMarkdownIncremental(accB, cb, candOpts as any)),
            `b${i}`,
            diffs,
          )
        }

        results.push({
          key: `${scenario.key}/multi-stream`,
          status: diffs.length === 0 ? 'match' : 'candidate-diff',
          diffs: diffs.slice(0, 20),
        })
      } catch (e) {
        results.push({
          key: `${scenario.key}/multi-stream`,
          status: 'harness-error',
          error: String(e),
        })
      }

      // Reset/disposal: after reset(), appended text must parse exactly
      // like a fresh document — no residue from the discarded prefix.
      try {
        const other = '# Reset doc\n\npara **x**\n'
        const candParser = candStream.createMarkdownStreamParser(candOpts as any)

        candParser.append(scenario.source.slice(0, Math.min(16, scenario.source.length)))
        candParser.reset()
        candParser.append(other)

        const candReset = canonCandDoc(candParser.finish())
        const diffs: Diff[] = []

        diffCanon(canonRef(ref.parseMarkdownAst(other, opts as any)), candReset, 'reset', diffs)
        results.push({
          key: `${scenario.key}/reset`,
          status: diffs.length === 0 ? 'match' : 'candidate-diff',
          diffs: diffs.slice(0, 20),
        })
      } catch (e) {
        results.push({ key: `${scenario.key}/reset`, status: 'harness-error', error: String(e) })
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

const ENGINES = ['chromium', 'firefox', 'webkit'] as const

async function runBrowserMode(mode: 'behavior' | 'layout') {
  const pw = await import('playwright')
  const { markdownBehaviorProbes, markdownLayoutProbes } = await import('./markdown-browser.ts')
  const servers = await serveBoth()
  const results: ScenarioResult[] = []

  try {
    for (const engine of ENGINES) {
      const browser = await pw[engine].launch()

      try {
        const probe = mode === 'behavior' ? markdownBehaviorProbes : markdownLayoutProbes
        const [reference, candidate] = await Promise.all([
          probe(browser, `http://127.0.0.1:${SIDES[0].port}`),
          probe(browser, `http://127.0.0.1:${SIDES[1].port}`),
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

        results.push({
          key: `${mode}-${engine}`,
          status: diffs.length === 0 ? 'match' : 'candidate-diff',
          diffs,
        })
      } catch (e) {
        results.push({ key: `${mode}-${engine}`, status: 'harness-error', error: String(e) })
      } finally {
        await browser.close()
      }
    }
  } finally {
    for (const s of servers) {
      await s.httpServer.close()
    }
  }

  return { mode, results }
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

  while (out.length < bytes) {
    out += para + list + table
  }

  return out
}

async function runPerformanceMode() {
  const ref = await import('@astryxdesign/core/Markdown/parser')
  const cand = await import('../../../packages/ui/src/markdown/markdown-parse.ts')
  const candHelpers = await import('../../../packages/ui/src/markdown/markdown-plugin-helpers.ts')
  const refPlugins = await import('@astryxdesign/core/Markdown/plugins')
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

    // Small docs parse in <1ms, so p95 of a short run is dominated by a
    // couple of scheduler/GC outliers — raise n there to keep the 1.2×
    // budget gate stable across runs.
    const n = bytes > 50 * 1024 ? 30 : 100
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

  // Plugin profile: the upstream soft-breaks helper workload (the restored
  // markdown-perf route profile) — full parse+transform per side.
  const pluginDoc = Array.from(
    { length: 50 },
    (_, i) => `claim ${i} with **bold**\nsoft line\nmore`,
  ).join('\n\n')

  const refPluginOpts = { plugins: [refPlugins.markdownSoftBreaksPlugin] }
  const candPluginOpts = { plugins: [candHelpers.markdownSoftBreaksPlugin] }

  for (let i = 0; i < 3; i++) {
    ref.parseMarkdownAst(pluginDoc, refPluginOpts as any)
    cand.parseMdDoc(pluginDoc, candPluginOpts as any)
  }

  const rp = samples(() => ref.parseMarkdownAst(pluginDoc, refPluginOpts as any), 100)
  const cp = samples(() => cand.parseMdDoc(pluginDoc, candPluginOpts as any), 100)

  results.push({
    key: 'perf-plugin-softbreaks',
    status: 'match',
    diffs: [
      {
        path: 'p95',
        kind: 'metric',
        reference: rp,
        candidate: cp,
      },
      {
        path: 'budgets',
        kind: 'metric',
        reference: PERF_BUDGETS,
        candidate: {
          p95Ratio: cp.p95 / Math.max(rp.p95, 1e-6),
          p95Within: cp.p95 / Math.max(rp.p95, 1e-6) <= PERF_BUDGETS.p95RatioMax,
        },
      },
    ],
  })

  // Unchanged-prefix repeated updates: the settled prefix is re-supplied
  // verbatim and only a small tail changes — the cache should dominate.
  const unchanged = workloads[2].source
  const refState = ref.createIncrementalState()
  const candStateMod = await import('../../../packages/ui/src/markdown/markdown-stream.ts')
  const cState = candStateMod.createMarkdownIncrementalState()

  ref.parseMarkdownIncremental(unchanged, refState as any, {} as any)
  candStateMod.parseMarkdownIncremental(unchanged, cState)

  const suffix = (i: number) => `tail ${i}`
  const rU = samples(() => {
    ref.parseMarkdownIncremental(unchanged + suffix(1), refState as any, {} as any)

    const s = ref.createIncrementalState()

    ref.parseMarkdownIncremental(unchanged, s as any, {} as any)
    Object.assign(refState, s)
  }, 12)

  const cU = samples(() => {
    candStateMod.parseMarkdownIncremental(unchanged + suffix(1), cState)

    const s = candStateMod.createMarkdownIncrementalState()

    candStateMod.parseMarkdownIncremental(unchanged, s)
    Object.assign(cState, s)
  }, 12)

  results.push({
    key: 'perf-unchanged-prefix',
    status: 'match',
    diffs: [{ path: 'p95', kind: 'metric', reference: rU, candidate: cU }],
  })

  // Simultaneous messages: 8 independent stream states fed the same 10 KB
  // doc in 256-char chunks — one pass per side.
  const simDoc = workloads[1].source
  const simRun = (makeState: () => unknown, step: (text: string, state: unknown) => void) => {
    const t0 = performance.now()
    const states = Array.from({ length: 8 }, makeState)

    for (let i = 0; i < simDoc.length; i += 256) {
      const snap = simDoc.slice(0, i + 256)

      for (const s of states) {
        step(snap, s)
      }
    }

    return performance.now() - t0
  }

  const rS = simRun(
    () => ref.createIncrementalState(),
    (t, s) => ref.parseMarkdownIncremental(t, s as any, {} as any),
  )

  const cS = simRun(
    () => candStateMod.createMarkdownIncrementalState(),
    (t, s) => candStateMod.parseMarkdownIncremental(t, s as any),
  )

  results.push({
    key: 'perf-simultaneous-8',
    status: 'match',
    diffs: [{ path: 'totalMs', kind: 'metric', reference: rS, candidate: cS }],
  })

  // Retained memory: 60 mount/parse/drop cycles — heap must not grow
  // monotonically. Bun.gc makes the comparison deterministic.
  const gc = (globalThis as { Bun?: { gc?: (full: boolean) => void } }).Bun?.gc

  if (gc) {
    const cycle = (parse: (s: string) => unknown) => {
      gc(true)

      const before = process.memoryUsage().heapUsed

      for (let i = 0; i < 60; i++) {
        const parser = candStateMod.createMarkdownStreamParser()

        parser.append(simDoc)
        void parse(simDoc)
      }

      gc(true)
      return process.memoryUsage().heapUsed - before
    }

    const rDelta = cycle((s) => ref.parseMarkdownAst(s))
    const cDelta = cycle((s) => cand.parseMdDoc(s))

    results.push({
      key: 'perf-retained-heap',
      status: cDelta <= Math.max(rDelta, 0) + 4 * 1024 * 1024 ? 'match' : 'candidate-diff',
      diffs: [
        {
          path: 'heapDeltaBytes',
          kind: 'metric',
          reference: rDelta,
          candidate: cDelta,
        },
      ],
    })
  }

  return {
    mode: 'performance' as const,
    results,
    environment: {
      runtime: `bun ${(globalThis as { Bun?: { version?: string } }).Bun?.version ?? 'unknown'}`,
      platform: `${process.platform}/${process.arch}`,
      host: `${process.env.HOSTNAME ?? 'local'} (darwin arm64 — recorded host)`,
      budgets: PERF_BUDGETS,
      method:
        'warmup 3, n=30–100 sorted samples → p50/p95/mean; incremental variants n=12; plugin profile n=100; deterministic corpus, same process both sides',
    },
  }
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

      if (errors.length > 0) {
        exitCode = 4
      } else if (diffs.length > 0) {
        exitCode = Math.max(exitCode, 1)
      }

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
