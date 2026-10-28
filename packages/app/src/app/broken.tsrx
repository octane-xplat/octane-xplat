import { Pressable, Screen, Text } from '@octane-xplat/ui'
import type { RouteErrorBoundaryProps } from '@octane-xplat/ui/routing'
import type { RouteLoaderArgs, RouteProps } from '../routes.gen.contracts'

/** Error exercises: search.fail='loader' returns a failed navigation and keeps
 * the committed screen. search.fail='render' renders ErrorBoundary instead.
 * Reset remounts the subtree; the deterministic render failure is caught again. */
export function validateSearch(raw: { fail?: unknown }) {
	if (raw.fail !== undefined && raw.fail !== 'loader' && raw.fail !== 'render') {
		throw new TypeError('Invalid fail mode')
	}

	return { fail: raw.fail }
}

export function loader({ search }: RouteLoaderArgs<'/broken'>) {
	if (search.fail === 'loader') {
		return Promise.reject(new Error('loader rejected'))
	}

	return { ok: true }
}

export function ErrorBoundary(props: RouteErrorBoundaryProps) @{
	<Screen className="vx-app gap-3">
		<Text className="text-2xl font-semibold">Route failed</Text>
		<Text id="broken-route" className="text-sm text-muted">
			{'route: ' + props.route.name}
		</Text>
		<Text id="broken-error" className="text-sm text-muted">
			{'error: ' + String(props.error)}
		</Text>
		<Pressable id="broken-reset" onPress={() => props.reset()} className="btn btn-secondary">
			<Text>Reset</Text>
		</Pressable>
	</Screen>
}

export function Broken(props: RouteProps<'/broken'>) @{
	if (props.search.fail === 'render') {
		throw new Error('render blew up')
	}

	<Screen className="vx-app gap-3">
		<Text className="text-2xl font-semibold">Broken route</Text>
		<Text id="broken-pending" className="text-sm text-muted">
			{'pending: ' + String(false)}
		</Text>
		<Text id="broken-data" className="text-sm text-muted">
			{'data: ' + JSON.stringify(props.data ?? null)}
		</Text>
		<Text id="broken-loader-error" className="text-sm text-muted">
			{'error: ' + String('none')}
		</Text>
	</Screen>
}
