import { createStore, type Store } from '@octane-xplat/ui/data'
import type { CatalogEntry } from '../catalog'
import type { StageHost, SessionSnapshot, SessionPhase } from '../session'
import { WorkshopSession } from '../session'
import type { StoryDefinition, WorkshopTarget } from '../contract'
import { applyControlInput, UNSET, type ControlValueInput } from '../controls'

export type ShellMode = 'wide' | 'compact' | 'phone'

export interface NativeShellState {
	/** Discovered story catalog. */
	catalog: readonly CatalogEntry[]
	/** Currently selected story id. */
	selectedId: string | null
	/** Selected id absent from the catalog. */
	missingId: string | null
	/** Active search/filter text. */
	query: string
	/** Catalog group ids the user collapsed. */
	collapsedGroups: ReadonlySet<string>
	/** Panel visibility/selection. */
	panel: 'stories' | 'controls' | null
	/** Render only the stage, hiding chrome. */
	stageOnly: boolean
	/** Controller display mode. */
	mode: ShellMode
	/** Wide mode only — the story catalog column is hidden. */
	catalogCollapsed: boolean
	/** Wide mode only — the controls column is hidden. */
	controlsCollapsed: boolean
	/** Unsaved control edits. */
	drafts: Record<string, string>
	/** Collected errors. */
	errors: Record<string, string>
	/** Catalog load failure. */
	catalogError: string
	/** Stage chrome: backdrop theme and whether the story gets bounded bounds. */
	stage: { background: 'default' | 'dark'; size: 'available' | 'bounded' }
	/** The workshop session being controlled. */
	session: SessionSnapshot
}

/** Window geometry changes shell presentation only, never the story root. */
export function shellMode(width: number, height: number): ShellMode {
	if (width >= 1000 && height >= 480) {
		return 'wide'
	}

	return width <= 600 ? 'phone' : 'compact'
}

/**
 * Shared native workshop controller — selection, panels, drafts and layout
 * mode for the AppKit, GTK and NativeScript chrome. Observable state lives in
 * one store the chrome reads with `useStore`; plain property accessors keep
 * hosts and tests working against the same shape.
 */
export class NativeWorkshopController {
	/** The workshop session being controlled. */
	readonly session: WorkshopSession
	/** Backing store for shell state; the chrome reads it with `useStore`. */
	readonly store: Store<NativeShellState>
	private generation = 0
	private disposed = false

	constructor(options: {
		host: StageHost
		target: WorkshopTarget
		/** Discovered story catalog. */
		catalog: readonly CatalogEntry[]
		globalProviders?: readonly unknown[]
	}) {
		this.session = new WorkshopSession({
			host: options.host,
			target: options.target,
			globalProviders: options.globalProviders,
		})
		this.store = createStore<NativeShellState>({
			/** Discovered story catalog. */
			catalog: options.catalog,
			/** Currently selected story id. */
			selectedId: null,
			/** Selected id absent from the catalog. */
			missingId: null,
			/** Active search/filter text. */
			query: '',
			collapsedGroups: new Set(),
			/** Panel visibility/selection. */
			panel: null,
			/** Render only the stage, hiding chrome. */
			stageOnly: false,
			/** Controller display mode. */
			mode: 'wide',
			catalogCollapsed: false,
			controlsCollapsed: false,
			/** Unsaved control edits. */
			drafts: {},
			/** Collected errors. */
			errors: {},
			/** Catalog load failure. */
			catalogError: '',
			stage: { background: 'default', size: 'available' },
			/** The workshop session being controlled. */
			session: this.session.state,
		})
		this.session.subscribe((snapshot) => this.set({ session: snapshot }))
	}

	/** Current shell-state snapshot. */
	get state(): NativeShellState {
		return this.store.getSnapshot()
	}

	private set(patch: Partial<NativeShellState>): void {
		this.store.update((s) => ({ ...s, ...patch }))
	}

	// Property accessors — the same names the mobile and macOS controllers
	// exposed, forwarded to the store so chrome/tests stay identical.
	/** Discovered story catalog. */
	get catalog(): readonly CatalogEntry[] {
		return this.state.catalog
	}
	/** Currently selected story id, or null when nothing is selected. */
	get selectedId(): string | null {
		return this.state.selectedId
	}
	/** Selected id absent from the current catalog, or null. */
	get missingId(): string | null {
		return this.state.missingId
	}
	/** Active search/filter text. */
	get query() {
		return this.state.query
	}
	set query(value: string) {
		this.set({ query: value })
	}
	/** Active side panel in compact/phone mode, or null when closed. */
	get panel() {
		return this.state.panel
	}
	set panel(value: 'stories' | 'controls' | null) {
		this.set({ panel: value })
	}
	/** Stage-only display flag — hides all chrome. */
	get stageOnly() {
		return this.state.stageOnly
	}
	set stageOnly(value: boolean) {
		this.set({ stageOnly: value })
	}
	/** Current display mode derived from window geometry. */
	get mode(): ShellMode {
		return this.state.mode
	}
	/** Unsaved control edits by control key. */
	get drafts(): Record<string, string> {
		return this.state.drafts
	}
	/** Collected control errors by control key. */
	get errors(): Record<string, string> {
		return this.state.errors
	}
	/** Catalog load failure message; empty when healthy. */
	get catalogError(): string {
		return this.state.catalogError
	}

	/** Recompute the display mode from window geometry — shell presentation only, never remounts the story. */
	resize(width: number, height: number): void {
		const mode = shellMode(width, height)
		if (mode !== this.state.mode) {
			this.set({ mode })
		}
	}

	/** Toggle a side panel: collapses the column in wide mode, selects/closes the panel in compact and phone modes. */
	toggle(panel: 'stories' | 'controls'): void {
		if (this.state.mode === 'wide') {
			if (panel === 'stories') {
				this.set({ catalogCollapsed: !this.state.catalogCollapsed })
			} else {
				this.set({ controlsCollapsed: !this.state.controlsCollapsed })
			}
		} else {
			this.set({ panel: this.state.panel === panel ? null : panel })
		}
	}

	/** Select and mount a story by catalog id; missing or inapplicable ids surface a `catalogError` instead of mounting. `revision` reloads the mounted story's module. */
	async select(id: string, revision?: string): Promise<void> {
		if (this.disposed) {
			return
		}

		const generation = ++this.generation
		const entry = this.state.catalog.find((item) => item.id === id)
		this.set({
			/** Currently selected story id. */
			selectedId: id,
			/** Selected id absent from the catalog. */
			missingId: entry ? null : id,
			/** Unsaved control edits. */
			drafts: {},
			/** Collected errors. */
			errors: {},
			/** Panel visibility/selection. */
			panel: null,
		})
		// Filtering is enforced again at the runtime boundary, before load.
		if (!entry?.applicable || !entry.load) {
			this.set({
				/** Catalog load failure. */
				catalogError: entry?.reason ?? `Story "${id}" is missing; choose from the catalog.`,
			})

			await this.session.dispose()
			return
		}

		try {
			if (revision) {
				this.session.markRebuilding()
			}

			const module = (await entry.load(revision)) as Record<string, unknown>
			if (generation !== this.generation || this.disposed) {
				return
			}

			const story = module[entry.exportName] as StoryDefinition<any, any, any>
			if (!story || story.id !== entry.id) {
				throw new Error(`Story export ${entry.exportName} does not match ${entry.id}`)
			}

			this.set({ catalogError: '' })
			if (revision) {
				await this.session.reload(story)
			} else {
				await this.session.select(story)
			}
		} catch (error) {
			if (generation === this.generation) {
				this.session.markCompileError(error)
			}
		}
	}

	/** Replace the discovered catalog (e.g. after HMR). Diagnostics become a `catalogError`; a still-valid selection reloads, a vanished one unmounts. */
	updateCatalog(
		/** Discovered story catalog. */
		catalog: readonly CatalogEntry[],
		diagnostics: readonly { message: string }[] = [],
	): void {
		if (this.disposed) {
			return
		}

		++this.generation
		this.set({ catalog })
		if (diagnostics.length) {
			const message = diagnostics.map((d) => d.message).join('\n')
			this.set({ catalogError: message })
			this.session.markCompileError(message)
			return
		}

		this.set({ catalogError: '' })
		if (this.state.selectedId) {
			const entry = catalog.find((item) => item.id === this.state.selectedId)
			if (!entry?.applicable || !entry.load) {
				this.set({ missingId: this.state.selectedId })
				void this.session.dispose()
				return
			}

			void this.select(this.state.selectedId, String(Date.now()))
		}
	}

	/**
	 * One Back/Escape step: dismiss shell chrome before the host treats the key
	 * as navigation. The active panel closes first; a stage-only session exits
	 * next; nothing to dismiss returns null so the key keeps its host meaning.
	 * Story content is untouched — panel/flag changes never mount or dispose.
	 */
	dismissOverlay(): 'panel' | 'stage-only' | null {
		if (this.state.panel) {
			this.set({ panel: null })
			return 'panel'
		}

		if (this.state.stageOnly) {
			this.set({ stageOnly: false })
			return 'stage-only'
		}

		return null
	}

	/** Apply a control edit to the mounted story; returns the error message or undefined on success. Pass `UNSET` to remove the key from the props bag. */
	control(key: string, input: ControlValueInput): string | undefined {
		const story = this.session.currentStory
		const control = story?.controls?.[key]
		if (!story || !control || this.session.state.phase !== 'ready') {
			return 'Wait for the story to be ready'
		}

		const drafts = { ...this.state.drafts }
		const errors = { ...this.state.errors }
		if (input !== UNSET) {
			drafts[key] = String(input)
		} else {
			delete drafts[key]
		}

		const result = applyControlInput(story, this.session.currentProps ?? {}, key, input as any)
		if (result.error) {
			errors[key] = result.error.message
		} else {
			delete errors[key]
			if (result.props) {
				this.session.applyProps(result.props)
			}
		}

		this.set({ drafts, errors })
		return result.error?.message
	}

	/** Clear drafts/errors and remount the story generation. */
	async reset(): Promise<void> {
		this.set({ drafts: {}, errors: {} })
		await this.session.reset()
	}

	/** Tear down the session and ignore further work; idempotent. */
	async dispose(): Promise<void> {
		this.disposed = true
		++this.generation
		await this.session.dispose()
	}

	/** Observable state for host automation and qualification evidence. */
	inspect(): {
		phase: SessionPhase
		storyId: string | null
		/** Currently selected story id. */
		selectedId: string | null
		revision: number
		mountedGeneration: number
		stale: boolean
		failure: string | null
		/** Catalog load failure. */
		catalogError: string | null
		props: Record<string, unknown> | null
		/** Backing store for controller state. */
		store: {} | null
		fixture: {} | null
		/** Controller display mode. */
		mode: ShellMode
		/** Panel visibility/selection. */
		panel: 'stories' | 'controls' | null
		/** Render only the stage, hiding chrome. */
		stageOnly: boolean
		/** Unsaved control edits. */
		drafts: {
			[x: string]: string
		}
		/** Collected errors. */
		errors: {
			[x: string]: string
		}
	} {
		const state = this.session.state
		const generation = (
			this.session as unknown as {
				current?: {
					fixture: unknown
					/** Backing store for controller state. */
					store?: { getSnapshot(): unknown }
				}
			}
		).current

		let store
		try {
			store = generation?.store?.getSnapshot()
		} catch {
			store = undefined
		}

		return {
			phase: state.phase,
			storyId: state.storyId ?? null,
			/** Currently selected story id. */
			selectedId: this.state.selectedId,
			revision: state.revision,
			mountedGeneration: state.mountedGeneration,
			stale: state.stale,
			failure: state.failure ? String(state.failure.message ?? state.failure) : null,
			/** Catalog load failure. */
			catalogError: this.state.catalogError || null,
			props: this.session.currentProps ?? null,
			/** Backing store for controller state. */
			store: store ?? null,
			fixture: generation?.fixture ?? null,
			/** Controller display mode. */
			mode: this.state.mode,
			/** Panel visibility/selection. */
			panel: this.state.panel,
			/** Render only the stage, hiding chrome. */
			stageOnly: this.state.stageOnly,
			/** Unsaved control edits. */
			drafts: { ...this.state.drafts },
			/** Collected errors. */
			errors: { ...this.state.errors },
		}
	}
}

export { UNSET }
