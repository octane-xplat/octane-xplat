import type { CatalogEntry } from '../catalog'
import type { StoryDefinition } from '../contract'
import { WorkshopSession } from '../session'
import { applyControlInput, type ControlValueInput } from '../controls'

/** Window geometry changes shell presentation only, never the story root. */
export function mobileShellMode(width: number, height: number): 'wide' | 'compact' | 'phone' {
	if (width >= 1000 && height >= 500) {
		return 'wide'
	}

	return width <= 600 ? 'phone' : 'compact'
}

export class MobileController {
	selectedId: string | null = null
	catalog: readonly CatalogEntry[]
	query = ''
	panel: 'stories' | 'controls' | null = null
	stageOnly = false
	missingId: string | null = null
	private generation = 0
	private disposed = false

	constructor(
		readonly session: WorkshopSession,
		catalog: readonly CatalogEntry[],
		readonly changed: () => void,
	) {
		this.catalog = catalog
	}

	async select(id: string, revision?: string): Promise<void> {
		if (this.disposed) {
			return
		}

		const generation = ++this.generation
		this.selectedId = id
		this.panel = null
		const entry = this.catalog.find((item) => item.id === id)
		this.missingId = entry ? null : id
		this.changed()
		// Filtering is enforced again at the runtime boundary, before load.
		if (!entry?.applicable || !entry.load) {
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
		this.catalog = catalog
		this.changed()
		if (diagnostics.length) {
			this.session.markCompileError(diagnostics.map((d) => d.message).join('\n'))
		} else if (this.selectedId) {
			void this.select(this.selectedId, String(Date.now()))
		}
	}

	/**
	 * One Back/Escape step: dismiss shell chrome before the host treats the key
	 * as navigation. The active panel closes first; a stage-only session exits
	 * next; nothing to dismiss returns null so the key keeps its host meaning.
	 * Story content is untouched — panel/flag changes never mount or dispose.
	 */
	dismissOverlay(): 'panel' | 'stage-only' | null {
		if (this.panel) {
			this.panel = null
			return 'panel'
		}

		if (this.stageOnly) {
			this.stageOnly = false
			return 'stage-only'
		}

		return null
	}

	control(key: string, value: ControlValueInput): string | undefined {
		const story = this.session.currentStory
		if (!story || this.session.state.phase !== 'ready') {
			return 'Wait for the story to be ready'
		}

		const result = applyControlInput(story, this.session.currentProps ?? {}, key, value)
		if (result.props) {
			this.session.applyProps(result.props)
		}

		return result.error?.message
	}

	async dispose(): Promise<void> {
		this.disposed = true
		++this.generation
		await this.session.dispose()
	}
}
