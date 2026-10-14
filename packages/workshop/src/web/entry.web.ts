/**
 * Workshop web entry — boots the shell, wires the session to HMR events, and
 * receives refreshed catalogs when the virtual catalog module re-executes.
 */
import { createElement, createRoot } from 'octane'
import { createStore } from '@octane-xplat/ui'
import type { CatalogEntry } from '../catalog'
import type { StoryDefinition, WorkshopTarget } from '../contract'
import type { SessionSnapshot } from '../session'
import { WorkshopSession } from '../session'
import { createWebStageHost } from './mount.web'
import { WorkshopApp } from './shell.web.tsrx'

export interface ShellState {
	mode: 'wide' | 'compact' | 'phone'
	query: string
	selectedId: string | null
	expanded: ReadonlySet<string>
	catalogCollapsed: boolean
	controlsCollapsed: boolean
	auxPanel: 'stories' | 'controls' | null
	stageOnly: boolean
	stageBackground: 'default' | 'light' | 'dark'
	stageBounds: 'available' | 'small' | 'medium'
	catalog: CatalogEntry[]
	catalogError: string | undefined
	missingId: string | null
	session: SessionSnapshot
	drafts: Record<string, string>
	fieldErrors: Record<string, string>
	unsetKeys: ReadonlySet<string>
}

export interface WorkshopRuntime {
	store: ReturnType<typeof createStore<ShellState>>
	session: WorkshopSession
	mountHost: HTMLElement
	selectEntry(entry: CatalogEntry): Promise<void>
	updateCatalog(entries: CatalogEntry[], diagnostics?: readonly { message: string }[]): void
	loadGeneration: number
}

let runtime: WorkshopRuntime | null = null

/** Called by the generated catalog module on load and on every HMR re-execution. */
export function catalogDidUpdate(entries: CatalogEntry[], diagnostics: readonly { message: string }[] = []): void {
	runtime?.updateCatalog(entries, diagnostics)
}

export interface WorkshopBootOptions {
	catalog: CatalogEntry[]
	diagnostics?: readonly { message: string }[]
	target: WorkshopTarget
	initialStoryId?: string | null
	globalProviders?: readonly unknown[]
	/** Vite HMR handle — passed by the generated entry because lib builds
	 *  fold `import.meta.hot` to undefined. */
	hot?: { on?: (event: string, cb: (payload?: unknown) => void) => void }
}

export function startWorkshop(options: WorkshopBootOptions): WorkshopRuntime {
	const mountHost = document.createElement('div')
	mountHost.className = 'xw-stage-host'

	const session = new WorkshopSession({
		host: createWebStageHost(mountHost),
		target: options.target,
		globalProviders: options.globalProviders ?? [],
	})

	const store = createStore<ShellState>({
		mode: 'wide',
		query: '',
		selectedId: null,
		expanded: new Set(groupKeys(options.catalog)),
		catalogCollapsed: false,
		controlsCollapsed: false,
		auxPanel: null,
		stageOnly: false,
		stageBackground: 'default',
		stageBounds: 'available',
		catalog: options.catalog,
		catalogError: options.diagnostics?.length ? options.diagnostics.map((d) => d.message).join('\n') : undefined,
		missingId: null,
		session: session.state,
		drafts: {},
		fieldErrors: {},
		unsetKeys: new Set(),
	})

	session.subscribe((snapshot) => {
		store.update((s) => ({ ...s, session: snapshot }))
	})

	runtime = {
		store,
		session,
		mountHost,
		loadGeneration: 0,
		async selectEntry(entry) {
			if (!entry.load) {
				return
			}

			const generation = ++runtime!.loadGeneration
			try {
				const loaded = await entry.load()
				if (generation !== runtime!.loadGeneration) {
					return
				}

				const definition = resolveDefinition(loaded, entry)
				await session.select(definition)
			} catch (error) {
				if (generation === runtime!.loadGeneration) {session.markCompileError(error)}
			}
		},
		updateCatalog(entries, diagnostics = []) {
			const generation = ++runtime!.loadGeneration
			const stamp = String(Date.now())
			store.update((s) => ({
				...s,
				catalog: entries,
				catalogError: diagnostics.length ? diagnostics.map((d) => d.message).join('\n') : undefined,
				expanded: new Set([...s.expanded, ...groupKeys(entries)]),
			}))

			if (diagnostics.length) {
				session.markCompileError(diagnostics.map((d) => d.message).join('\n'))
				return
			}

			const current = store.getSnapshot().selectedId
			if (!current) {
				return
			}

			const entry = pickEntry(entries, current)
			if (!entry?.load) {
				store.update((s) => ({ ...s, missingId: current }))
				void session.dispose()
				return
			}

			void (async () => {
				try {
					const loaded = await entry.load!(stamp)
					if (generation !== runtime!.loadGeneration) {
						return
					}

					await session.reload(resolveDefinition(loaded, entry))
				} catch (error) {
					if (generation === runtime!.loadGeneration) {session.markCompileError(error)}
				}
			})()
		},
	}

	// Automation hook — tests and the dev bridge read the live session/store.
	;(globalThis as Record<string, unknown>).__xplatWorkshopRuntime = runtime

	// Dev-server lifecycle: rebuilds mark the stage rebuilding; a failed
	// transform keeps the last good stage and marks it stale.
	let updateLoadGeneration = 0
	options.hot?.on?.('vite:beforeUpdate', () => {
		updateLoadGeneration = runtime!.loadGeneration
		session.markRebuilding()
	})

	options.hot?.on?.('vite:afterUpdate', () => {
		// Octane component modules self-accept HMR, which can stop propagation
		// before the catalog. Retire/remount once the successful update has
		// applied; a catalog update already owns its own fresh generation.
		if (runtime!.loadGeneration === updateLoadGeneration && session.state.stale) {
			runtime!.updateCatalog(store.getSnapshot().catalog)
		}
	})

	options.hot?.on?.('vite:error', (payload) => {
		const err = payload as { err?: { message?: string } } | undefined
		session.markCompileError(err?.err?.message ?? 'source update failed')
	})

	options.hot?.on?.('vite:ws:disconnect', () => session.markDisconnected())
	options.hot?.on?.('vite:ws:connect', () => session.markConnected())

	const hostElement = document.getElementById('workshop-root') ?? document.body
	createRoot(hostElement).render(
		createElement(WorkshopApp as never, { runtime } as never),
	)

	// Hash selection: #/story/<id> survives reloads and deep-links a story.
	const idFromHash = () => {
		const raw = location.hash.replace(/^#\/?story\//, '')
		try { return decodeURIComponent(raw) || null } catch { return raw || null }
	}

	const pickEntry = (entries: CatalogEntry[], id: string) =>
		entries.find((e) => e.id === id && e.load) ?? entries.find((e) => e.id === id)

	const initialId = options.initialStoryId ?? idFromHash()
	if (initialId) {
		const entry = pickEntry(options.catalog, initialId)
		if (entry?.load) {
			store.update((s) => ({ ...s, selectedId: initialId }))
			void runtime.selectEntry(entry)
		} else {
			store.update((s) => ({ ...s, selectedId: initialId, missingId: initialId }))
		}
	}

	globalThis.addEventListener?.('hashchange', () => {
		const id = idFromHash()
		if (id && id !== store.getSnapshot().selectedId) {
			const entry = pickEntry(store.getSnapshot().catalog, id)
			if (entry?.load) {
				store.update((s) => ({ ...s, selectedId: id, missingId: null }))
				void runtime!.selectEntry(entry)
			} else {
				++runtime!.loadGeneration
				store.update((s) => ({ ...s, selectedId: id, missingId: id }))
				void session.dispose()
			}
		}
	})

	return runtime
}

/** Group keys (`name@depth`) for every title segment group in the catalog. */
function groupKeys(entries: CatalogEntry[]): string[] {
	const keys = new Set<string>()
	for (const entry of entries) {
		const segments = entry.title.split('/').map((seg) => seg.trim()).filter(Boolean)
		for (let depth = 0; depth < segments.length - 1; depth++) {
			keys.add(`${segments[depth]}@${depth}`)
		}
	}

	return [...keys]
}

function resolveDefinition(loaded: unknown, entry: CatalogEntry): StoryDefinition<any, any, any> {
	const mod = loaded as Record<string, unknown>
	const candidate: unknown = mod?.[entry.exportName]
	const definition = candidate as StoryDefinition<any, any, any> | undefined
	if (!definition || typeof definition !== 'object' || definition.id !== entry.id) {
		throw new Error(
			`story module ${entry.file} did not provide a story definition at export "${entry.exportName}"`,
		)
	}

	return definition
}
