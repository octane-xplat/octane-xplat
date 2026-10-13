/**
 * Web stage host — mounts a prepared story renderable inside the shell's
 * stage element through the real Octane DOM renderer. Each generation owns
 * its root; `unmount` disposes the subtree including owned portals.
 */
import { ErrorBoundary, createElement, createRoot } from 'octane'
import { composeStory } from 'storybook/preview-api'
import type { MountedStory, MountRequest, StageHost } from '../session'

function storyTree(request: MountRequest): any {
	let inner: any = createElement(request.component as any, request.props)
	for (const provider of [...request.providers].reverse()) {
		inner = createElement(provider as any, { fixture: request.fixture } as any, inner)
	}

	// A story render error swaps to a marker node and reports to the session;
	// the shell keeps navigation/reset reachable around the failed subtree.
	return createElement(
		ErrorBoundary as any,
		{
			fallback: (error: unknown) => {
				// The fallback runs inside the render pass — octane rejects store
				// updates there, so report after the pass commits.
				queueMicrotask(() => request.onRenderError(error))
				return createElement('div', {
					className: 'xw-stage-error-marker',
					role: 'alert',
				})
			},
		},
		inner,
	)
}

export function createWebStageHost(stageElement: HTMLElement): StageHost {
	return {
		mount(request: MountRequest): MountedStory {
			// Pin the visual harness's portable composition subset to Storybook
			// 10.6.1. Octane still mounts the compiled component; the session
			// owns fixtures, providers, cancellation and every cleanup.
			const composed = composeStory(
				{ args: request.props },
				{ title: request.story.title, component: request.component } as any,
				{ render: (props: any) => storyTree({ ...request, props }) } as any,
				{}, 'Story',
			)

			const mountPoint = globalThis.document.createElement('div')
			mountPoint.className = 'xw-stage-mount'
			stageElement.append(mountPoint)
			const root = createRoot(mountPoint)

			try {
				root.render(composed(request.props) as any)
			} catch (error) {
				root.unmount()
				mountPoint.remove()
				throw error
			}

			let disposed = false
			return {
				update(props: Record<string, unknown>) {
					if (disposed) {
						return
					}

					root.render(composed(props) as any)
				},
				unmount() {
					if (disposed) {
						return
					}

					disposed = true
					try { root.unmount() } finally { mountPoint.remove() }
				},
			}
		},
	}
}
