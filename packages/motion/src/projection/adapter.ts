import type { ProjectionNode } from './node'
import type { HostAdapter } from '../host-types'

/** Feed channel writes into the projection node; while projecting they only
 *  mark the projection dirty — the projected transform owns the host. */
export function attachProjection(node: ProjectionNode, adapter: HostAdapter): HostAdapter {
	node.attach({
		measureLayout: () => adapter.measureLayout?.() ?? null,
		resetProjection: () => adapter.resetProjection?.(),
		project: (write) => adapter.project?.(write),
		writeOpacity: (opacity) => adapter.write({ opacity }),
	})

	return {
		pan: adapter.pan?.bind(adapter),
		read: adapter.read.bind(adapter),
		restore: adapter.restore.bind(adapter),
		gesture: adapter.gesture?.bind(adapter),
		measureLayout: adapter.measureLayout?.bind(adapter),
		resetProjection: adapter.resetProjection?.bind(adapter),
		project: adapter.project?.bind(adapter),
		write(values) {
			node.setLatestValues(values)
			if (node.isProjecting() || node.hasProjected || node.sharedOpacity !== undefined) {
				node.isProjectionDirty = true
				node.root.requestProjectionFrame()
				// Shared crossfades own opacity; other opacity writes stay direct.
				if (values.opacity !== undefined && node.sharedOpacity === undefined) {
					adapter.write({ opacity: values.opacity })
				}
			} else {
				adapter.write(values)
			}
		},
	}
}
