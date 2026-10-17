// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
/**
 * Workshop macOS e2e — drives `xplat workshop dev --target macos` on the real
 * AppKit/JavaScriptCore host through its stdin automation protocol and asserts
 * catalog/applicability, mount through the real macOS renderer, gesture-action
 * interaction, typed controls, Unset, reset, failure surfaces and recovery,
 * save/reload, and owned-window cleanup end to end.
 *
 * Interaction evidence here is gesture-action dispatch through each view's
 * real NSClickGestureRecognizer target — it is not OS-synthesized input. The
 * window is created offscreen so the run never takes desktop focus.
 *
 * Usage: node scripts/e2e-macos.ts [consumerRoot]
 *        (consumerRoot defaults to this demo app; a packed consumer passes its own)
 */
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = process.argv[2]
	? resolve(process.argv[2])
	: fileURLToPath(new URL('..', import.meta.url))

const storyFile = join(appRoot, 'src/stories/counter.stories.tsrx')
const originalStory = readFileSync(storyFile, 'utf8')

const proc = spawn(
	join(appRoot, 'node_modules/.bin/xplat'),
	['workshop', 'dev', '--target', 'macos'],
	{
		cwd: appRoot,
		env: {
			...process.env,
			OCTANE_WORKSHOP_OFFSCREEN: '1',
			OCTANE_MACOS_AUTOMATION: '1',
		},
		stdio: ['pipe', 'pipe', 'pipe'],
	},
)

const pending = []
const seen = []
let waiters = []
let buffer = ''
proc.stdout.on('data', (chunk) => {
	buffer += chunk
	let index
	while ((index = buffer.indexOf('\n')) >= 0) {
		const line = buffer.slice(0, index).trimEnd()
		buffer = buffer.slice(index + 1)
		if (!line) {
			continue
		}

		console.log(`  | ${line}`)
		if (line.startsWith('WORKSHOP_STATE ')) {
			try {
				seen.push(JSON.parse(line.slice('WORKSHOP_STATE '.length)))
			} catch {}
		}

		for (const waiter of [...waiters]) {
			if (waiter.match(line)) {
				waiters = waiters.filter((w) => w !== waiter)
				clearTimeout(waiter.timer)
				waiter.resolve(line)
			}
		}

		pending.push(line)
	}
})

proc.stderr.on('data', (chunk) => process.stderr.write(chunk))

const next = (prefix, timeoutMs = 60_000) => {
	const match = (line) => line.startsWith(prefix)
	const found = pending.findIndex(match)
	if (found >= 0) {
		return Promise.resolve(pending.splice(found, 1)[0])
	}

	return new Promise((resolve, reject) => {
		waiters.push({
			match,
			resolve,
			timer: setTimeout(() => reject(new Error(`timed out waiting for ${prefix}`)), timeoutMs),
		})
	})
}

const results = []
const check = (name, ok, detail = '') => {
	results.push([name, ok])
	console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
}

// 'close' is handled directly by the host; every other verb bumps the
// host-side command sequence included in WORKSHOP_STATE. States also carry
// a monotonic dump id `d` — reloads emit extra states that share seq, so
// edit-triggered waits require a dump newer than the last one consumed.
let expectedSeq = 0
let lastDump = 0
const send = (command) => {
	proc.stdin.write(`${command}\n`)
	if (command !== 'close') {
		++expectedSeq
	}
}

const state = async (command, timeout) => {
	if (command) {
		send(command)
	}

	while (true) {
		const line = await next('WORKSHOP_STATE ', timeout)
		const parsed = JSON.parse(line.slice('WORKSHOP_STATE '.length))
		const fresh = parsed.d > lastDump
		if (!fresh) {
			continue
		}

		if (command && parsed.seq !== expectedSeq) {
			continue
		}

		lastDump = parsed.d
		return parsed
	}
}

try {
	await next('WORKSHOP_MACOS_HOST', 300_000)
	check('AppKit/JSC host started', true)

	send('catalog')
	const catalog = JSON.parse((await next('WORKSHOP_CATALOG ')).slice('WORKSHOP_CATALOG '.length))
	const applicable = catalog
		.filter((e) => e.applicable)
		.map((e) => e.id)
		.sort()

	check(
		'catalog lists macOS-applicable stories',
		applicable.join(',') ===
			'counter/async-fixture,counter/basic,counter/static,failing/broken,failing/fixture,isolation/resources,providers/theme',
		applicable.join(','),
	)

	const inapplicable = catalog.filter((e) => !e.applicable)
	check(
		'platform leaves stay in catalog as unsupported',
		inapplicable.length === 3,
		inapplicable.map((e) => `${e.id}: ${e.reason}`).join(' | '),
	)

	let s = await state('select counter/basic')
	check(
		'basic mounts through macOS renderer',
		s.phase === 'ready' &&
			s.props?.step === 1 &&
			s.store?.count === 0 &&
			s.fixture?.account === 'Demo',
		`${s.phase} props=${JSON.stringify(s.props)} store=${JSON.stringify(s.store)}`,
	)

	s = await state('press Increment')
	check('gesture dispatch updates story state', s.store?.count === 1, JSON.stringify(s.store))

	s = await state('control step 5')
	check(
		'number control applies full props bag',
		s.props?.step === 5 && s.store?.count === 1,
		`props=${JSON.stringify(s.props)} store=${JSON.stringify(s.store)}`,
	)

	s = await state('press Increment')
	check('control affects next interaction', s.store?.count === 6, JSON.stringify(s.store))

	s = await state('control step 99')
	check(
		'out-of-range input preserves stage value',
		s.props?.step === 5 && s.errors?.step,
		`props=${JSON.stringify(s.props)} errors=${JSON.stringify(s.errors)}`,
	)

	s = await state('unset label')
	check('Unset removes optional prop', s.props && !('label' in s.props), JSON.stringify(s.props))

	s = await state('reset')
	check(
		'reset restores defaults and fresh state',
		s.phase === 'ready' && s.props?.step === 1 && s.store?.count === 0,
		`props=${JSON.stringify(s.props)} store=${JSON.stringify(s.store)}`,
	)

	s = await state('select counter/async-fixture', 30_000)
	check(
		'async fixture resolves before mount',
		s.phase === 'ready' && s.fixture?.account === 'AsyncAccount',
		JSON.stringify(s.fixture),
	)

	// A pending fixture cancelled by a newer selection must never mount late:
	// the 600ms async fixture is still in flight when the next select runs.
	// Dumps carry the global command seq, so the superseded select's dump can
	// surface while the new generation is still preparing — wait for ready.
	const lateMarker = seen.length
	send('select counter/async-fixture')
	s = await state('select counter/basic')
	let lateDeadline = Date.now() + 30_000
	while (!(s.storyId === 'counter/basic' && s.phase === 'ready')) {
		s = await state('status', Math.max(1, lateDeadline - Date.now()))
		if (Date.now() > lateDeadline) {
			break
		}
	}

	const readyDump = s.d
	lateDeadline = Date.now() + 900
	while (Date.now() < lateDeadline) {
		try {
			await state('status', Math.max(1, lateDeadline - Date.now()))
		} catch {
			break
		}
	}

	check(
		'late fixture resolution cannot mount after a newer selection',
		s.storyId === 'counter/basic' &&
			s.phase === 'ready' &&
			!seen
				.slice(lateMarker)
				.some(
					(x) => x.storyId === 'counter/async-fixture' && x.phase === 'ready' && x.d > readyDump,
				),
		`story=${s.storyId} phase=${s.phase}`,
	)

	s = await state('select isolation/resources')
	check(
		'isolation story mounts with providers',
		s.phase === 'ready',
		s.phase + ' ' + (s.failure ?? ''),
	)

	s = await state('press Open owned overlay')
	check('story opens owned secondary window', s.openWindows === 1, `openWindows=${s.openWindows}`)

	s = await state('press Mutate data')
	check(
		'fixture mutation propagates',
		s.fixture?.nested?.label === 'changed',
		JSON.stringify(s.fixture),
	)

	s = await state('select counter/basic')
	check(
		'switching releases owned window',
		s.openWindows === 0 && s.phase === 'ready',
		`openWindows=${s.openWindows} phase=${s.phase}`,
	)

	s = await state('select failing/broken')
	check(
		'render failure surfaces readable error',
		s.phase === 'failed' && /render|mount/i.test(s.failure ?? ''),
		s.failure ?? '',
	)

	s = await state('select failing/fixture')
	check(
		'fixture failure surfaces readable error',
		s.phase === 'failed' && /fixture/i.test(s.failure ?? ''),
		s.failure ?? '',
	)

	s = await state('select counter/basic')
	check('recovers after failure', s.phase === 'ready' && s.store?.count === 0, s.phase)

	s = await state('select providers/theme')
	check(
		'provider story mounts',
		s.phase === 'ready' && s.fixture?.account === 'Provided',
		`${s.phase} fixture=${JSON.stringify(s.fixture)}`,
	)

	s = await state('select nope/missing')
	check(
		'missing story shows catalog error, no unrelated mount',
		s.catalogError !== null && s.phase !== 'ready',
		`${s.phase} ${s.catalogError}`,
	)

	s = await state('select counter/basic')
	check('re-select works after missing id', s.phase === 'ready', s.phase)

	s = await state('panel controls')
	check('aux panel toggles', s.panel === 'controls', s.panel)

	s = await state('stage-only on')
	check(
		'stage-only keeps session mounted',
		s.stageOnly === true && s.phase === 'ready',
		`stageOnly=${s.stageOnly} phase=${s.phase}`,
	)

	await state('stage-only off')

	s = await state('query async')
	check('query filters catalog', s.phase === 'ready', s.phase)
	await state('query ')

	// Save/reload: a successful edit remounts the selected story at defaults.
	// Rebuild signaling is asynchronous, so poll status until it lands.
	const waitFor = async (predicate, timeout = 60_000) => {
		const deadline = Date.now() + timeout
		while (Date.now() < deadline) {
			const next = await state('status', Math.max(1_000, deadline - Date.now()))
			if (predicate(next)) {
				return next
			}
		}

		return null
	}

	const before = s.revision
	const editStart = performance.now()
	writeFileSync(storyFile, `${originalStory}\n// e2e reload probe\n`)
	const remounted = await waitFor((x) => x.phase === 'ready' && x.revision > before)
	const editLatency = Math.round(performance.now() - editStart)
	check(
		'successful edit remounts selected story',
		remounted !== null && remounted.storyId === 'counter/basic' && remounted.store?.count === 0,
		remounted
			? `phase=${remounted.phase} story=${remounted.storyId} rev=${remounted.revision} warm-edit=${editLatency}ms`
			: 'no remount observed',
	)

	console.log(`  | warm edit→ready latency: ${editLatency}ms (goal ≤5000ms native)`)

	writeFileSync(storyFile, 'export const Broken = defineStory({ syntax error')
	const broken = await waitFor((x) => x.phase === 'failed' || x.stale === true)
	check(
		'bad edit fails honestly',
		broken !== null && (broken.phase === 'failed' || broken.stale === true),
		broken
			? `phase=${broken.phase} stale=${broken.stale} failure=${broken.failure}`
			: 'no stale/failed state observed',
	)

	writeFileSync(storyFile, originalStory)
	const healed = await waitFor((x) => x.phase === 'ready')
	check(
		'corrected edit remounts fresh',
		healed !== null,
		healed?.phase ?? 'no ready state observed',
	)

	send('close')
	const code = await new Promise((resolve) => {
		proc.once('exit', (code) => resolve(code))
		setTimeout(() => resolve('timeout'), 20_000)
	})

	check('clean shutdown', code === 0, `exit=${code}`)
} catch (error) {
	check('driver completed', false, String(error?.message ?? error))
} finally {
	writeFileSync(storyFile, originalStory)
	proc.stdin.destroy()
	proc.kill('SIGTERM')
	setTimeout(() => proc.kill('SIGKILL'), 10_000).unref()
	const failures = results.filter(([, ok]) => !ok)
	console.log(`${results.length - failures.length}/${results.length} checks passed`)
	process.exitCode = failures.length ? 1 : 0
}
