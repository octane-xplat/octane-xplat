import { createNativeScriptRoot, type UniversalComponent } from '@nativescript-community/octane'
import { composeStory } from 'storybook/preview-api'
import type { ContentView } from '@nativescript/core'
import type { StageHost, MountRequest } from '../session'
import { StoryTree } from '../native/story-tree.tsrx'

/** Owns only this stage root; never detaches a runner or application host. */
export function createMobileStageHost(stage: ContentView): StageHost {
	return {
		mount(request: MountRequest) {
			// Match the pinned portable composition subset used by the web and
			// private native harness; fixtures/providers remain session-owned.
			const composed = composeStory(
				{ args: request.props },
				{ title: request.story.title, component: request.component } as any,
				{ render: (props: any) => ({ ...request, props }) } as any,
				{},
				'Story',
			)

			const prepare = (props: Record<string, unknown>): MountRequest => ({
				...(composed(props) as unknown as MountRequest),
				// The session owns a complete props bag. Composition must not
				// clone injected stores/fixtures or restore a removed default.
				props,
			})

			const root = createNativeScriptRoot(stage)
			try {
				root.render(StoryTree as unknown as UniversalComponent, { request: prepare(request.props) })
			} catch (error) {
				root.unmount()
				throw error
			}

			let disposed = false
			return {
				update(props: Record<string, unknown>) {
					if (disposed) {
						return
					}

					try {
						root.render(StoryTree as unknown as UniversalComponent, { request: prepare(props) })
					} catch (error) {
						request.onRenderError(error)
					}
				},
				unmount() {
					if (disposed) {
						return
					}

					disposed = true
					root.unmount()
				},
			}
		},
	}
}
