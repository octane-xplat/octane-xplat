import { createStore, type Store } from '@octane-xplat/ui/data'
import type { CatalogEntry } from '../catalog'
import type { StageHost, SessionSnapshot, SessionPhase } from '../session'
import { WorkshopSession } from '../session'
import type { StoryDefinition, WorkshopTarget } from '../contract'
import { applyControlInput, UNSET, type ControlValueInput } from '../controls'

export type ShellMode = 'wide' | 'compact' | 'phone'

export interface NativeShellState {
	catalog: readonly CatalogEntry[]
	selectedId: string | null
	missingId: string | null
	query: string
	collapsedGroups: ReadonlySet<string>
	panel: 'stories' | 'controls' | null
	stageOnly: boolean
	mode: ShellMode
	catalogCollapsed: boolean
	controlsCollapsed: boolean
	drafts: Record<string, string>
	errors: Record<string, string>
	catalogError: string
	stage: { background: 'default' | 'dark'; size: 'available' | 'bounded' }
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
	readonly session: WorkshopSession
	readonly store: Store<NativeShellState>
	private generation = 0
	private disposed = false

	constructor(options: {
		host: StageHost
		target: WorkshopTarget
		catalog: readonly CatalogEntry[]
		globalProviders?: readonly unknown[]
	}) {
		this.session = new WorkshopSession({
			host: options.host,
			target: options.target,
			globalProviders: options.globalProviders,
		})
		this.store = createStore<NativeShellState>({
			catalog: options.catalog,
			selectedId: null,
			missingId: null,
			query: '',
			collapsedGroups: new Set(),
			panel: null,
			stageOnly: false,
			mode: 'wide',
			catalogCollapsed: false,
			controlsCollapsed: false,
			drafts: {},
			errors: {},
			catalogError: '',
			stage: { background: 'default', size: 'available' },
			session: this.session.state,
		})
		this.session.subscribe((snapshot) => this.set({ session: snapshot }))
	}

	get state(): NativeShellState {
		return this.store.getSnapshot()
	}

	private set(patch: Partial<NativeShellState>): void {
		this.store.update((s) => ({ ...s, ...patch }))
	}

	// Property accessors — the same names the mobile and macOS controllers
	// exposed, forwarded to the store so chrome/tests stay identical.
	get catalog(): readonly CatalogEntry[] {
		return this.state.catalog
	}
	get selectedId(): string | null {
		return this.state.selectedId
	}
	get missingId(): string | null {
		return this.state.missingId
	}
	get query() {
		return this.state.query
	}
	set query(value: string) {
		this.set({ query: value })
	}
	get panel() {
		return this.state.panel
	}
	set panel(value: 'stories' | 'controls' | null) {
		this.set({ panel: value })
	}
	get stageOnly() {
		return this.state.stageOnly
	}
	set stageOnly(value: boolean) {
		this.set({ stageOnly: value })
	}
	get mode(): ShellMode {
		return this.state.mode
	}
	get drafts(): Record<string, string> {
		return this.state.drafts
	}
	get errors(): Record<string, string> {
		return this.state.errors
	}
	get catalogError(): string {
		return this.state.catalogError
	}

	resize(width: number, height: number): void {
		const mode = shellMode(width, height)
		if (mode !== this.state.mode) {
			this.set({ mode })
		}
	}

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

	async select(id: string, revision?: string): Promise<void> {
		if (this.disposed) {
			return
		}

		const generation = ++this.generation
		const entry = this.state.catalog.find((item) => item.id === id)
		this.set({
			selectedId: id,
			missingId: entry ? null : id,
			drafts: {},
			errors: {},
			panel: null,
		})
		// Filtering is enforced again at the runtime boundary, before load.
		if (!entry?.applicable || !entry.load) {
			this.set({
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

	updateCatalog(
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

	async reset(): Promise<void> {
		this.set({ drafts: {}, errors: {} })
		await this.session.reset()
	}

	async dispose(): Promise<void> {
		this.disposed = true
		++this.generation
		await this.session.dispose()
	}

	/** Observable state for host automation and qualification evidence. */
	inspect(): {
		phase: SessionPhase
		storyId: string | null
		selectedId: string | null
		revision: number
		mountedGeneration: number
		stale: boolean
		failure: string | null
		catalogError: string | null
		props: Record<string, unknown> | null
		store: {} | null
		fixture: {} | null
		mode: ShellMode
		panel: 'stories' | 'controls' | null
		stageOnly: boolean
		drafts: {
			[x: string]: string
		}
		errors: {
			[x: string]: string
		}
	} {
		const state = this.session.state
		const generation = (
			this.session as unknown as {
				current?: {
					fixture: unknown
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
			selectedId: this.state.selectedId,
			revision: state.revision,
			mountedGeneration: state.mountedGeneration,
			stale: state.stale,
			failure: state.failure ? String(state.failure.message ?? state.failure) : null,
			catalogError: this.state.catalogError || null,
			props: this.session.currentProps ?? null,
			store: store ?? null,
			fixture: generation?.fixture ?? null,
			mode: this.state.mode,
			panel: this.state.panel,
			stageOnly: this.state.stageOnly,
			drafts: { ...this.state.drafts },
			errors: { ...this.state.errors },
		}
	}
}

export { UNSET }
