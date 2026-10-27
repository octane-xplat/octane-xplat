import { createGtkRoot, type GtkView } from '@octane-xplat/linux-gtk'
import type { StageHost, MountRequest, MountedStory } from '../session'
import { StoryTree } from './story-tree.tsrx'

/** Session-owned GTK root on the stage slot's widget. */
export function createGtkStageHost(widget: GtkView): StageHost {
	return {
		mount(request: MountRequest): MountedStory {
			const { root } = createGtkRoot(widget)
			const render = (props: Record<string, unknown>) =>
				root.render(StoryTree as any, { request: { ...request, props } })

			try {
				render(request.props)
			} catch (error) {
				try {
					root.unmount()
				} catch (cleanup) {
					throw new AggregateError([error, cleanup], 'GTK mount and rollback failed')
				}

				throw error
			}

			let disposed = false
			return {
				update(props) {
					if (!disposed) {
						render({ ...props })
					}
				},
				unmount() {
					if (!disposed) {
						disposed = true
						root.unmount()
					}
				},
			}
		},
	}
}
