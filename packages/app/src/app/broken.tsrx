import { Pressable, Screen, Text } from '@octane-xplat/ui';
import type { RouteErrorBoundaryProps } from '@octane-xplat/ui';

/** broken route — the error-boundary exercise. Push with
 *  {fail: 'loader'} to reject the loader (the screen gets `error`; a
 *  direct-URL entry also shows `pending` while it runs). Push with
 *  {fail: 'render'} to throw mid-render and land in `ErrorBoundary`.
 *  The boundary's Reset remounts the subtree — `fail: 'render'` is
 *  deterministic, so it recatches, which is itself the contract. */
export function loader(params: Record<string, unknown>) {
	if (params.fail === 'loader') {
		return Promise.reject(new Error('loader rejected'));
	}

	return { ok: true };
}

export function ErrorBoundary(props: RouteErrorBoundaryProps) @{
	<Screen className="vx-app gap-3">
		<Text className="text-2xl font-semibold">Route failed</Text>
		<Text id="broken-route" className="text-sm text-muted">{'route: ' + props.route.name}</Text>
		<Text id="broken-error" className="text-sm text-muted">{'error: ' + String(props.error)}</Text>
		<Pressable id="broken-reset" onPress={() => props.reset()} className="btn btn-secondary">
			<Text>Reset</Text>
		</Pressable>
	</Screen>
}

export function Broken(props: {
	fail?: string;
	data?: { ok: boolean };
	error?: unknown;
	pending?: boolean;
}) @{
	if (props.fail === 'render') {
		throw new Error('render blew up');
	}

	<Screen className="vx-app gap-3">
		<Text className="text-2xl font-semibold">Broken route</Text>
		<Text id="broken-pending" className="text-sm text-muted">
			{'pending: ' + String(props.pending === true)}
		</Text>
		<Text id="broken-data" className="text-sm text-muted">
			{'data: ' + JSON.stringify(props.data ?? null)}
		</Text>
		<Text id="broken-loader-error" className="text-sm text-muted">
			{'error: ' + String(props.error ?? 'none')}
		</Text>
	</Screen>
}
