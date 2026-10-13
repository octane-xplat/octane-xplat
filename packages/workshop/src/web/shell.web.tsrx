/**
 * Adaptive workshop shell — catalog, stage, controls, status.
 * DOM vocabulary is correct here: this is the DOM-host surface (browser and
 * the Linux WebKitGTK webview share it).
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'octane'
import { useStore } from '@octane-xplat/ui'
import type { CatalogEntry } from '../catalog'
import { WORKSHOP_TARGETS, type StoryDefinition } from '../contract'
import { UNSET, applyControlInput, isUnsettable } from '../controls'
import type { WorkshopRuntime, ShellState } from './entry.web'
import { describeCause } from '../errors'

const WIDE_MIN = 1080
const PHONE_MAX = 640

const EMPTY_EXAMPLE = [
	"import { defineStory } from '@octane-xplat/workshop'",
	'',
	'export const Basic = defineStory({',
	"  id: 'example/basic',",
	"  title: 'Example / Basic',",
	"  targets: 'all',",
	'  component: MyComponent,',
	'  args: {},',
	'})',
].join('\n')

const INCLUDE_PATTERN = '**/*.stories.{ts,tsx,tsrx}'

const modeFor = (width: number, height: number) =>
	width >= WIDE_MIN && height >= 480 ? 'wide' : width <= PHONE_MAX ? 'phone' : 'compact'

/** Re-observe whenever the root element is (re)created — a mode swap can
 *  replace the node, and a detached node reports 0×0, which would stick the
 *  shell in phone mode. */
function observeMode(el: HTMLElement, store: WorkshopRuntime['store']): ResizeObserver {
	const observer = new ResizeObserver((entries) => {
		if (!el.isConnected) {
			return
		}

		const width = entries[0]?.contentRect.width ?? el.clientWidth
		const mode = modeFor(width, entries[0]?.contentRect.height ?? el.clientHeight)
		// Defer past the notification frame — a synchronous re-render that
		// resizes the root reports "ResizeObserver loop" noise.
		requestAnimationFrame(() => {
			if (el.isConnected && store.get().mode !== mode) {
				store.set((s) => ({ ...s, mode }))
			}
		})
	})

	observer.observe(el)
	return observer
}

function selectStory(runtime: WorkshopRuntime, entry: CatalogEntry) {
	const store = runtime.store
	if (!entry.load) {
		return
	}

	const s = store.get()
	store.set({
		...s,
		selectedId: entry.id,
		missingId: null,
		auxPanel: s.mode === 'wide' ? s.auxPanel : null,
		drafts: {},
		fieldErrors: {},
		unsetKeys: new Set(),
	})

	location.hash = `#/story/${encodeURIComponent(entry.id)}`
	void runtime.selectEntry(entry)
}

// ---------- status bar ----------

function StatusBar(props: { runtime: WorkshopRuntime }) {
	const s = useStore(props.runtime.store)
	const session = s.session
	const phaseLabel =
		session.phase === 'rebuilding'
			? 'rebuilding'
			: session.phase === 'preparing'
				? 'preparing fixtures'
				: session.phase === 'mounting'
					? 'mounting'
					: session.phase === 'disposing'
						? 'disposing'
						: session.phase === 'restart-required'
							? 'restart required'
							: session.phase

	return (
		<header className="xw-statusbar">
			<details className="xw-target-menu">
				<summary className="xw-target-chip" aria-label="Workshop targets">{props.runtime.session.target}</summary>
				<ul>
					{WORKSHOP_TARGETS.map((target) => <li key={target}>
						{target}: {currentDefinition(props.runtime)?.targets !== 'all' &&
							currentDefinition(props.runtime)?.targets &&
							!currentDefinition(props.runtime)!.targets.includes(target)
							? 'unsupported by this story' : targetStatus(props.runtime.session.target, target)}
					</li>)}
				</ul>
			</details>
			<span className="xw-title" title={s.selectedId ?? ''}>
				{s.selectedId ?? 'No story selected'}
			</span>
			<span className={`xw-phase xw-phase-${session.phase}`} aria-live="polite">
				{phaseLabel}
				{session.stale && session.phase !== 'rebuilding' ? ' · stale' : ''}
			</span>
			<span className="xw-spacer" />
			{s.mode !== 'wide' ? (
				<>
					<button
						type="button"
						className="xw-btn"
						data-workshop-opener="stories"
						aria-pressed={s.auxPanel === 'stories'}
						onClick={() => toggleAux(props.runtime, 'stories')}
					>
						Stories
					</button>
					<button
						type="button"
						className="xw-btn"
						data-workshop-opener="controls"
						aria-pressed={s.auxPanel === 'controls'}
						onClick={() => toggleAux(props.runtime, 'controls')}
					>
						Controls
					</button>
				</>
			) : (
				<>
					<button
						type="button"
						className="xw-btn"
						aria-pressed={!s.catalogCollapsed}
						title="Toggle story catalog"
						onClick={() =>
							props.runtime.store.set((x) => ({ ...x, catalogCollapsed: !x.catalogCollapsed }))
						}
					>
						Catalog
					</button>
					<button
						type="button"
						className="xw-btn"
						aria-pressed={!s.controlsCollapsed}
						title="Toggle controls panel"
						onClick={() =>
							props.runtime.store.set((x) => ({ ...x, controlsCollapsed: !x.controlsCollapsed }))
						}
					>
						Controls
					</button>
				</>
			)}
			<button
				type="button"
				className="xw-btn xw-reset"
				disabled={!s.selectedId || session.phase === 'preparing' || session.phase === 'mounting'}
				onClick={() => {
					clearEdits(props.runtime)
					void props.runtime.session.reset()
				}}
			>
				Reset
			</button>
			<button
				type="button"
				className="xw-btn"
				title="Hide workshop chrome (Esc or the floating button returns)"
				onClick={() => props.runtime.store.set((x) => ({ ...x, stageOnly: true }))}
			>
				Stage only
			</button>
		</header>
	)
}

function toggleAux(runtime: WorkshopRuntime, panel: 'stories' | 'controls') {
	const s = runtime.store.get()
	runtime.store.set({ ...s, auxPanel: s.auxPanel === panel ? null : panel })
}

function clearEdits(runtime: WorkshopRuntime) {
	runtime.store.set((s) => ({ ...s, drafts: {}, fieldErrors: {}, unsetKeys: new Set() }))
}

// ---------- catalog ----------

interface Group {
	name: string
	entries: CatalogEntry[]
	children: Map<string, Group>
}

function groupEntries(entries: CatalogEntry[], query: string): Group {
	const root: Group = { name: '', entries: [], children: new Map() }
	const q = query.trim().toLowerCase()
	const filtered = q
		? entries.filter(
				(e) => e.id.toLowerCase().includes(q) || e.title.toLowerCase().includes(q),
			)
		: entries

	for (const entry of filtered) {
		const segments = entry.title.split('/').map((seg) => seg.trim()).filter(Boolean)
		let group = root
		for (const seg of segments.slice(0, -1)) {
			let next = group.children.get(seg)
			if (!next) {
				next = { name: seg, entries: [], children: new Map() }
				group.children.set(seg, next)
			}

			group = next
		}

		group.entries.push(entry)
	}

	for (const g of [root, ...descendants(root)]) {
		g.entries.sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id))
	}

	return root
}

function descendants(group: Group): Group[] {
	return [...group.children.values()].flatMap((g) => [g, ...descendants(g)])
}

function GroupView(props: { runtime: WorkshopRuntime; group: Group; depth: number }) {
	const s = useStore(props.runtime.store)
	return (
		<>
			{[...props.group.children.values()]
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((child) => {
					const key = `${child.name}@${props.depth}`
					const open = s.expanded.has(key) || Boolean(s.query)
					return (
						<div key={key} className="xw-group">
							<button
								type="button"
								className="xw-group-head"
								aria-expanded={open}
								onClick={() =>
									props.runtime.store.set((x) => {
										const next = new Set(x.expanded)
										if (next.has(key)) next.delete(key)
										else next.add(key)

										return { ...x, expanded: next }
									})
								}
							>
								<span className="xw-caret" aria-hidden>{open ? '▾' : '▸'}</span> {child.name}
							</button>
							{open ? <GroupView runtime={props.runtime} group={child} depth={props.depth + 1} /> : null}
						</div>
					)
				})}
			{props.group.entries.map((entry) => (
				<button
					key={entry.id}
					type="button"
					className={`xw-story ${entry.id === s.selectedId ? 'xw-story-active' : ''}`}
					disabled={!entry.load}
					title={entry.load ? entry.id : `${entry.id} — ${entry.reason ?? 'not supported on this target'}`}
					onClick={() => selectStory(props.runtime, entry)}
				>
					<span className="xw-story-name">{entry.title.split('/').pop()?.trim() || entry.title}</span>
					{!entry.load ? <span className="xw-story-badge">unsupported</span> : null}
				</button>
			))}
		</>
	)
}

function catalogBody(s: ShellState, runtime: WorkshopRuntime, groups: Group) {
	if (s.catalogError) {
		return <div className="xw-error" role="alert">{s.catalogError}</div>
	}

	if (s.catalog.length === 0) {
		return (
			<div className="xw-empty">
				<p>No stories found.</p>
				<p>Expected include: <code>{INCLUDE_PATTERN}</code></p>
				<pre className="xw-example">{EMPTY_EXAMPLE}</pre>
			</div>
		)
	}

	return <GroupView runtime={runtime} group={groups} depth={0} />
}

function CatalogPanel(props: { runtime: WorkshopRuntime; mode: 'wide' | 'overlay' }) {
	const s = useStore(props.runtime.store)
	const groups = groupEntries(s.catalog, s.query)
	return (
		<aside className={`xw-panel xw-catalog ${props.mode === 'overlay' ? 'xw-overlay' : ''}`} aria-label="Story catalog">
			<div className="xw-panel-head">
				<input
					type="search"
					className="xw-search"
					placeholder="Search stories"
					aria-label="Search stories"
					value={s.query}
					onInput={(e: any) =>
						props.runtime.store.set((x) => ({ ...x, query: e.target.value }))
					}
				/>
				{props.mode === 'overlay' ? (
					<button
						type="button"
						className="xw-btn"
						onClick={() => props.runtime.store.set((x) => ({ ...x, auxPanel: null }))}
					>
						Close
					</button>
				) : null}
			</div>
			<div className="xw-panel-body" aria-label="Stories">
				{catalogBody(s, props.runtime, groups)}
			</div>
		</aside>
	)
}

// ---------- controls ----------

function currentDefinition(runtime: WorkshopRuntime): StoryDefinition<any, any, any> | undefined {
	return runtime.session.currentStory
}

/** Honest per-target launch status — `xplat workshop doctor` is the
 *  authoritative machine check; this is the in-shell summary. */
function targetStatus(active: string, target: string): string {
	if (target === active) {
		return 'available (active host)'
	}

	switch (target) {
		case 'web':
			return 'available'
		case 'linux':
			return 'requires a Linux host'
		default:
			return 'unqualified backend'
	}
}

function ControlField(props: {
	runtime: WorkshopRuntime
	name: string
	control: any
	definition: StoryDefinition<any, any, any>
}) {
	const s = useStore(props.runtime.store)
	const store = props.runtime.store
	const key = props.name
	const control = props.control
	const genProps = props.runtime.session.currentProps
	const value = genProps?.[key]
	const isSet = genProps ? key in genProps : false
	const draft = s.drafts[key]
	const error = s.fieldErrors[key]
	const composing = useRef(false)

	const commit = (raw: string | boolean | number | typeof UNSET) => {
		const genProps = props.runtime.session.currentProps ?? {}
		const result = applyControlInput(props.definition, genProps, key, raw)
		if (result.error) {
			store.set((x) => ({
				...x,
				fieldErrors: { ...x.fieldErrors, [key]: result.error!.message },
			}))

			return
		}

		store.set((x) => {
			const drafts = { ...x.drafts }
			delete drafts[key]
			const fieldErrors = { ...x.fieldErrors }
			delete fieldErrors[key]
			const unsetKeys = new Set(x.unsetKeys)
			if (raw === UNSET) unsetKeys.add(key)
			else unsetKeys.delete(key)

			return { ...x, drafts, fieldErrors, unsetKeys }
		})

		props.runtime.session.applyProps(result.props!)
	}

	const setDraft = (text: string) =>
		store.set((x) => ({ ...x, drafts: { ...x.drafts, [key]: text } }))

	let field = null
	if (control.type === 'boolean') {
		field = (
			<input
				type="checkbox"
				checked={Boolean(value)}
				disabled={s.session.phase !== 'ready'}
				aria-label={key}
				onChange={(e: any) => commit(e.target.checked)}
			/>
		)
	} else if (control.type === 'enum') {
		field = (
			<select
				value={isSet ? String(value) : ''}
				disabled={s.session.phase !== 'ready'}
				aria-label={key}
				onChange={(e: any) => {
					const raw = e.target.value
					const option = (control.options ?? []).find((o: unknown) => String(o) === raw)
					commit(option as never)
				}}
			>
				{!isSet ? <option value="">(unset)</option> : null}
				{(control.options ?? []).map((o: unknown) => (
					<option key={String(o)} value={String(o)}>{String(o)}</option>
				))}
			</select>
		)
	} else {
		const shown = draft ?? (isSet ? String(value ?? '') : '')
		field = (
			<input
				type={control.type === 'number' ? 'number' : 'text'}
				value={shown}
				placeholder={isSet ? undefined : '(unset)'}
				aria-label={key}
				aria-invalid={Boolean(error)}
				min={control.min}
				max={control.max}
				step={control.step}
				onCompositionStart={() => { composing.current = true }}
				onCompositionEnd={(e: any) => { composing.current = false; setDraft(e.target.value) }}
				onInput={(e: any) => setDraft(e.target.value)}
				onKeyDown={(e: any) => {
					if (e.key === 'Enter' && !e.isComposing && !composing.current) {
						commit(e.target.value)
					} else if (e.key === 'Escape' && !e.isComposing && !composing.current) {
						setDraft(isSet ? String(value ?? '') : '')
						e.target.blur()
					}
				}}
				onBlur={(e: any) => {
					if (composing.current) return
					if ((draft ?? e.target.value) !== (isSet ? String(value ?? '') : '')) {
						commit(draft ?? e.target.value)
					}
				}}
			/>
		)
	}

	const unsettable = isUnsettable(props.definition, key)
	return (
		<div className="xw-field">
			<div className="xw-field-row">
				<label className="xw-field-label" title={key}>{key}</label>
				{field}
				{unsettable && isSet ? (
					<button type="button" className="xw-btn xw-unset" onClick={() => commit(UNSET)}>
						Unset
					</button>
				) : null}
				{!isSet && key in (props.definition.args ?? {}) ? (
					<button
						type="button"
						className="xw-btn"
						onClick={() => commit(props.definition.args[key])}
					>
						Default
					</button>
				) : null}
			</div>
			{error ? <div className="xw-field-error" role="alert">{error}</div> : null}
		</div>
	)
}

function ControlsPanel(props: { runtime: WorkshopRuntime; mode: 'wide' | 'overlay' }) {
	const s = useStore(props.runtime.store)
	const definition = currentDefinition(props.runtime)
	const controls = (definition?.controls ?? {}) as Record<string, unknown>
	const keys = Object.keys(controls)
	return (
		<aside className={`xw-panel xw-controls ${props.mode === 'overlay' ? 'xw-overlay' : ''}`} aria-label="Story controls">
			<div className="xw-panel-head">
				<span className="xw-panel-title">Controls</span>
				{props.mode === 'overlay' ? (
					<button
						type="button"
						className="xw-btn"
						onClick={() => props.runtime.store.set((x) => ({ ...x, auxPanel: null }))}
					>
						Close
					</button>
				) : null}
			</div>
			<div className="xw-panel-body">
				<fieldset className="xw-environment">
					<legend>Stage environment</legend>
					<label>Background <select aria-label="Stage background" value={s.stageBackground}
						onChange={(e: any) => props.runtime.store.set(x => ({ ...x, stageBackground: e.target.value }))}>
						<option value="default">Default</option><option value="light">Light</option><option value="dark">Dark</option>
					</select></label>
					<label>Bounds <select aria-label="Stage bounds" value={s.stageBounds}
						onChange={(e: any) => props.runtime.store.set(x => ({ ...x, stageBounds: e.target.value }))}>
						<option value="available">Available space</option><option value="small">320 × 240</option><option value="medium">640 × 480</option>
					</select></label>
				</fieldset>
				{!definition ? (
					<div className="xw-empty">Select a story to edit its declared controls.</div>
				) : keys.length === 0 ? (
					<div className="xw-empty">This story declares no controls.</div>
				) : (
					keys.map((key) => (
						<ControlField
							key={key}
							runtime={props.runtime}
							name={key}
							control={controls[key]}
							definition={definition}
						/>
					))
				)}
			</div>
		</aside>
	)
}

// ---------- stage ----------

function StageView(props: { runtime: WorkshopRuntime }) {
	const s = useStore(props.runtime.store)
	const session = s.session
	const failure = session.failure
	return (
		<main className="xw-stage-area" data-workshop-stage>
			<div
				className={`xw-stage-slot xw-background-${s.stageBackground}`}
				style={s.stageBounds === 'available' ? undefined : {
					width: s.stageBounds === 'small' ? 320 : 640,
					height: s.stageBounds === 'small' ? 240 : 480,
					flex: 'none',
				}}
				ref={(el: HTMLElement | null) => {
					if (el && props.runtime.mountHost.parentNode !== el) {
						el.append(props.runtime.mountHost)
					}
				}}
			/>
			{s.missingId ? (
				<div className="xw-stage-note xw-error" role="alert">
					<p>Story <code>{s.missingId}</code> was not found in the catalog.</p>
					<button
						type="button"
						className="xw-btn"
						onClick={() => {
							const store = props.runtime.store
							store.set((x) => ({ ...x, missingId: null, auxPanel: 'stories' }))
						}}
					>
						Browse stories
					</button>
				</div>
			) : null}
			{session.phase === 'preparing' || session.phase === 'mounting' || session.phase === 'disposing' ? (
				<div className="xw-stage-note" role="status">
					{session.phase === 'preparing' ? 'Preparing fixtures…' : session.phase === 'mounting' ? 'Mounting…' : 'Disposing…'}
				</div>
			) : null}
			{session.phase === 'rebuilding' && !s.missingId ? (
				<div className="xw-stage-note xw-subtle" role="status">Rebuilding — remounting latest successful revision…</div>
			) : null}
			{session.phase === 'failed' && failure ? (
				<div className="xw-stage-note xw-error" role="alert">
					<p className="xw-error-title">
						{failure.phase} error{failure.storyId ? ` — ${failure.storyId}` : ''}
					</p>
					<pre className="xw-error-detail">{failure.message}</pre>
					{failure.cause !== undefined ? (
						<pre className="xw-error-detail">{describeCause(failure.cause)}</pre>
					) : null}
					<div className="xw-error-actions">
						{failure.phase === 'fixture' ? (
							<button type="button" className="xw-btn" onClick={() => void props.runtime.session.reset()}>
								Retry
							</button>
						) : null}
						<button type="button" className="xw-btn" onClick={() => { clearEdits(props.runtime); void props.runtime.session.reset() }}>
							Reset
						</button>
					</div>
					{session.stale ? <p className="xw-subtle">The last successful stage remains mounted and is marked stale.</p> : null}
				</div>
			) : null}
			{session.phase === 'restart-required' ? (
				<div className="xw-stage-note xw-error" role="alert">
					<p className="xw-error-title">Restart required</p>
					<pre className="xw-error-detail">{failure?.message ?? 'Owned cleanup did not finish in time.'}</pre>
					<p className="xw-subtle">Restart the workshop target (`xplat workshop dev`) to continue.</p>
				</div>
			) : null}
			{session.phase === 'disconnected' ? (
				<div className="xw-stage-note" role="status">Dev server disconnected — reconnecting…</div>
			) : null}
			{session.stale && session.phase !== 'failed' ? (
				<div className="xw-stale-badge" role="status">stale</div>
			) : null}
		</main>
	)
}

// ---------- app ----------

export function WorkshopApp(props: { runtime: WorkshopRuntime }) {
	const s = useStore(props.runtime.store)
	const openerRef = useRef<HTMLElement | null>(null)
	const openerKeyRef = useRef<string | null>(null)
	const observerRef = useRef<ResizeObserver | null>(null)

	const attachRoot = (el: HTMLDivElement | null) => {
		observerRef.current?.disconnect()
		observerRef.current = null
		if (el) {
			observerRef.current = observeMode(el, props.runtime.store)
			const mode = modeFor(el.clientWidth, el.clientHeight)
			if (props.runtime.store.get().mode !== mode) {
				props.runtime.store.set((x) => ({ ...x, mode }))
			}
		}
	}

	useLayoutEffect(() => () => observerRef.current?.disconnect(), [])

	// Escape dismisses the auxiliary panel; focus returns to its opener. A
	// story-owned dialog inside the stage keeps its own Escape handling.
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== 'Escape' || e.isComposing) {
				return
			}

			const state = props.runtime.store.get()
			if (state.stageOnly) {
				props.runtime.store.set((x) => ({ ...x, stageOnly: false }))
				return
			}

			if (!state.auxPanel) {
				return
			}

			const active = document.activeElement
			if (
				active instanceof Element &&
				active.closest('[data-workshop-stage] [role="dialog"], [data-workshop-stage] [role="alertdialog"]')
			) {
				return
			}

			props.runtime.store.set((x) => ({ ...x, auxPanel: null }))
		}

		document.addEventListener('keydown', onKeyDown)
		return () => document.removeEventListener('keydown', onKeyDown)
	}, [])

	// Restore focus to the opener when an overlay panel closes.
	const prevAux = useRef<ShellState['auxPanel']>(null)
	useEffect(() => {
		const prev = prevAux.current
		prevAux.current = s.auxPanel
		if (!prev && s.auxPanel) {
			openerRef.current = document.activeElement as HTMLElement | null
			openerKeyRef.current = s.auxPanel
			requestAnimationFrame(() => {
				if (props.runtime.store.get().auxPanel) {
					document.querySelector<HTMLElement>('.xw-overlay input, .xw-overlay button')?.focus()
				}
			})
		}

		if (prev && !s.auxPanel && openerRef.current) {
			const opener = openerRef.current
			const openerKey = openerKeyRef.current
			openerRef.current = null
			requestAnimationFrame(() => {
				const key = opener.dataset.workshopOpener ?? openerKey
				const current = key ? document.querySelector<HTMLElement>(`[data-workshop-opener="${key}"]`) : opener
				current?.focus()
			})
		}
	}, [s.auxPanel])

	if (s.stageOnly) {
		return (
			<div className="xw-root xw-stageonly" ref={attachRoot}>
				<StageView runtime={props.runtime} />
				<div className="xw-stageonly-bar">
					<button
						type="button"
						className="xw-btn"
						onClick={() => props.runtime.store.set((x) => ({ ...x, stageOnly: false }))}
					>
						Workshop
					</button>
					<button
						type="button"
						className="xw-btn"
						onClick={() => { clearEdits(props.runtime); void props.runtime.session.reset() }}
					>
						Reset
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className={`xw-root xw-${s.mode}`} ref={attachRoot}>
			<StatusBar runtime={props.runtime} />
			<div className="xw-body">
				{s.mode === 'wide' && !s.catalogCollapsed ? <CatalogPanel runtime={props.runtime} mode="wide" /> : null}
				<StageView runtime={props.runtime} />
				{s.mode === 'wide' && !s.controlsCollapsed ? <ControlsPanel runtime={props.runtime} mode="wide" /> : null}
				{s.mode !== 'wide' && s.auxPanel === 'stories' ? (
					<CatalogPanel runtime={props.runtime} mode="overlay" />
				) : null}
				{s.mode !== 'wide' && s.auxPanel === 'controls' ? (
					<ControlsPanel runtime={props.runtime} mode="overlay" />
				) : null}
			</div>
			<div className="xw-live" aria-live="polite" role="status">
				{s.session.phase === 'failed' ? 'Error: ' + String(s.session.failure?.message ?? '') : ''}
			</div>
		</div>
	)
}
