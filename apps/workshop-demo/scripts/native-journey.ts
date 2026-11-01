// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
/**
 * Shared native workshop journey — spawns `xplat workshop dev --target <t>`,
 * speaks the stdin line protocol, and drives the common acceptance path:
 * catalog/applicability, mount, gesture dispatch, typed controls, Unset,
 * reset, late-fixture guard, failure surfaces and recovery, panels,
 * save/reload, and clean shutdown.
 *
 * Host scripts (e2e-macos.ts, e2e-gtk.ts) pass host-specific launch details
 * and any extra assertions via hooks:
 *  - `afterHostStarted(ctx)` — e.g. GTK's bundle-externalization assertion
 *  - `leafSteps(ctx)`         — runs after the late-fixture guard (macOS's
 *                               isolation/owned-window block, GTK's leaf mount)
 *  - `overlaySteps(ctx)`      — runs after 'aux panel toggles' (macOS Escape)
 *  - `normalize(line)`        — GTK strips the `Gjs-Console-Message:` prefix
 */

import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function runNativeJourney(options) {
	const appRoot = process.argv[2]
		? resolve(process.argv[2])
		: fileURLToPath(new URL('..', import.meta.url))

	const storyFile = join(appRoot, 'src/stories/counter.stories.tsrx')
	const originalStory = readFileSync(storyFile, 'utf8')

	const normalize = options.normalize ?? ((line) => line)

	const proc = spawn(
		join(appRoot, 'node_modules/.bin/xplat'),
		['workshop', 'dev', '--target', options.target],
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
			if (normalize(line).startsWith('WORKSHOP_STATE ')) {
				try {
					seen.push(JSON.parse(normalize(line).slice('WORKSHOP_STATE '.length)))
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
		const match = (line) => normalize(line).startsWith(prefix)
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
			const parsed = JSON.parse(normalize(line).slice('WORKSHOP_STATE '.length))
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

	const ctx = { appRoot, proc, send, state, check, seen, next }

	const main = async () => {
		try {
			await next(options.hostBanner, 300_000)
			check(options.hostCheckName, true)

			await options.afterHostStarted?.(ctx)

			send('catalog')
			const catalog = JSON.parse(
				normalize(await next('WORKSHOP_CATALOG ')).slice('WORKSHOP_CATALOG '.length),
			)

			const applicable = catalog
				.filter((e) => e.applicable)
				.map((e) => e.id)
				.sort()

			check(
				`catalog lists ${options.catalogLabel}-applicable stories`,
				applicable.join(',') === options.expectedApplicable,
				applicable.join(','),
			)

			const inapplicable = catalog.filter((e) => !e.applicable)
			check(
				'platform leaves stay in catalog as unsupported',
				inapplicable.length === options.expectedInapplicable,
				inapplicable.map((e) => `${e.id}: ${e.reason}`).join(' | '),
			)

			let s = await state('select counter/basic')
			check(
				`basic mounts through ${options.rendererName}`,
				s.phase === 'ready' &&
					s.props?.step === 1 &&
					s.store?.count === 0 &&
					s.fixture?.account === 'Demo',
				`${s.phase} props=${JSON.stringify(s.props)} store=${JSON.stringify(s.store)}`,
			)

			// Exercise the rendered chrome's own actions, beyond controller commands.
			const mounted = s.mountedGeneration
			for (const [name, collapsed] of [
				['Stories', 'catalogCollapsed'],
				['Controls', 'controlsCollapsed'],
			]) {
				if (s.mode !== 'wide') {
					s = await state(`chrome-press ${name}`)
				}

				s = await state(`chrome-press Close ${name}`)
				check(
					`${name} close action dismisses its panel`,
					s.mode === 'wide' ? s[collapsed] === true : s.panel === null,
				)

				s = await state(`chrome-press ${name}`)
				check(
					`${name} toolbar action reopens panel`,
					s.mode === 'wide' ? s[collapsed] === false : s.panel === name.toLowerCase(),
				)
			}

			s = await state('chrome-press Stage only')
			check(
				'stage-only chrome action preserves story root',
				s.stageOnly === true && s.mountedGeneration === mounted,
			)

			s = await state('chrome-press Return to workshop')
			check(
				'return chrome action preserves story root',
				s.stageOnly === false && s.mountedGeneration === mounted,
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

			await state('control label "Chrome test"')
			if (s.mode !== 'wide') {
				await state('chrome-press Controls')
			}

			s = await state('chrome-press Unset label')
			check(
				'Unset removes optional prop',
				s.props && !('label' in s.props),
				JSON.stringify(s.props),
			)

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
							(x) =>
								x.storyId === 'counter/async-fixture' && x.phase === 'ready' && x.d > readyDump,
						),
				`story=${s.storyId} phase=${s.phase}`,
			)

			await options.leafSteps?.(ctx)

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

			await options.overlaySteps?.(ctx)

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
			const waitFor = async (predicate, timeout = 120_000) => {
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

			check(
				'all rendered action targets were found',
				!pending.some((line) => line.includes('WORKSHOP_PRESS_MISS')),
			)

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
	}

	return main()
}
