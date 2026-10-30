/** @jsxImportSource @octane-xplat/jsx */
import type { MountRequest } from '../session'

function Providers(p: { request: MountRequest; index: number }) {
	const provider = p.request.providers[p.index] as ((props: any) => unknown) | undefined
	if (!provider) return <{p.request.component} {...p.request.props} />
	return (
		<{provider} fixture={p.request.fixture}>
			<Providers request={p.request} index={p.index + 1} />
		</{provider}>
	)
}

export function StoryTree(p: { request: MountRequest }): unknown @{
	@try {
		<Providers request={p.request} index={0} />
	} @catch (error) {
		queueMicrotask(() => p.request.onRenderError(error))
		<label text="Story failed; use Reset or Stories." />
	}
}
