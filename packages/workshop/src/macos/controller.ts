import { WorkshopSession } from '../session'
import { applyControlInput, UNSET } from '../controls'
import type { CatalogEntry } from '../catalog'
import type { StageHost } from '../session'
import type { StoryDefinition } from '../contract'

/** Selection and draft ownership are independent of the native chrome's layout. */
export class MacOSWorkshopController {
	readonly session: WorkshopSession
	catalog: readonly CatalogEntry[] = []
	selectedId: string | null = null
	query = ''
	panel: 'stories' | 'controls' | null = null
	stageOnly = false
	mode: 'wide' | 'compact' | 'phone' = 'wide'
	drafts: Record<string, string> = {}
	errors: Record<string, string> = {}
	catalogError = ''
	private loadGeneration = 0
	private readonly listeners = new Set<() => void>()
	constructor(host: StageHost, providers: readonly unknown[] = []) {
		this.session = new WorkshopSession({ host, target: 'macos', globalProviders: providers })
		this.session.subscribe(() => this.notify())
	}
	subscribe(listener: () => void) {
		this.listeners.add(listener)
		return () => this.listeners.delete(listener)
	}
	notify() {
		for (const listener of this.listeners) {
			listener()
		}
	}
	resize(width: number, height: number) {
		this.mode = width >= 1000 && height >= 480 ? 'wide' : width <= 560 ? 'phone' : 'compact'
		this.notify()
	}
	async select(id: string) {
		const serial = ++this.loadGeneration
		this.selectedId = id
		this.drafts = {}
		this.errors = {}
		this.panel = null
		this.notify()
		const entry =
			this.catalog.find((e) => e.id === id && e.applicable && e.load) ??
			this.catalog.find((e) => e.id === id)

		if (!entry?.applicable || !entry.load) {
			await this.session.dispose()
			this.catalogError = entry?.reason ?? `Story "${id}" is missing; choose from the catalog.`
			this.notify()
			return
		}

		try {
			const loaded = await entry.load()
			if (serial !== this.loadGeneration) {
				return
			}

			const definition = (loaded as Record<string, unknown>)[entry.exportName] as StoryDefinition<
				any,
				any,
				any
			>

			if (!definition || definition.id !== id) {
				throw new Error(`Story export ${entry.exportName} no longer declares ${id}`)
			}

			this.catalogError = ''
			await this.session.select(definition)
		} catch (error) {
			if (serial === this.loadGeneration) {
				this.session.markCompileError(error)
			}
		}
	}
	async updateCatalog(
		catalog: readonly CatalogEntry[],
		diagnostics: readonly { message: string }[] = [],
	) {
		this.catalog = catalog
		if (diagnostics.length) {
			++this.loadGeneration
			this.catalogError = diagnostics.map((d) => d.message).join('\n')
			this.session.markCompileError(this.catalogError)
			this.notify()
			return
		}

		this.catalogError = ''
		if (this.selectedId) {
			await this.select(this.selectedId)
		}

		this.notify()
	}
	control(key: string, input: unknown) {
		const story = this.session.currentStory
		const control = story?.controls?.[key]
		if (!story || !control || this.session.state.phase !== 'ready') {
			return
		}

		if (input !== UNSET) {
			this.drafts[key] = String(input)
		}

		const result = applyControlInput(story, this.session.currentProps ?? {}, key, input as any)
		if (result.error) {
			this.errors[key] = result.error.message
		} else if (result.props) {
			delete this.errors[key]
			this.session.applyProps(result.props)
		}

		this.notify()
	}
	async reset() {
		this.drafts = {}
		this.errors = {}
		await this.session.reset()
		this.notify()
	}
	async dispose() {
		++this.loadGeneration
		await this.session.dispose()
		this.listeners.clear()
	}
	/** Observable state for host automation and qualification evidence. */
	inspect() {
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
			selectedId: this.selectedId,
			revision: state.revision,
			mountedGeneration: state.mountedGeneration,
			stale: state.stale,
			failure: state.failure ? String(state.failure.message ?? state.failure) : null,
			catalogError: this.catalogError || null,
			props: this.session.currentProps ?? null,
			store: store ?? null,
			fixture: generation?.fixture ?? null,
			mode: this.mode,
			panel: this.panel,
			stageOnly: this.stageOnly,
			drafts: { ...this.drafts },
			errors: { ...this.errors },
		}
	}
}
