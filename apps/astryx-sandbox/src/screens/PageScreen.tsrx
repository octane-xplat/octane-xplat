// Authored /pages/* route screen — all authored pages are pending in this
// unit, so it renders the honest placeholder with the pinned source and
// route-group framing upstream would give it.

import { View } from '@octane-xplat/ui'
import { routeRow } from '../coverage/coverage'
import { PendingScreen } from '../shell/PendingScreen'
import { SandboxShell } from '../shell/SandboxShell'
import { PageLayout } from '../shell/PageLayout'
import { NotFoundScreen } from './NotFoundScreen'

export function PageScreen(props: { params: { rest?: string } }) @{
	const route = `/pages/${props.params.rest ?? ''}/`
	const row = routeRow(route)

	if (!row) {
		return <NotFoundScreen title="Not Found" message={`“${route}” is not part of the pinned sandbox route table.`} />
	}

	if (row.group !== 'sandbox') {
		// (fullscreen) and (raw) routes render unframed upstream.
		return (
			<View className="sb-template-frame">
				<PendingScreen row={row} />
			</View>
		)
	}

	return (
		<SandboxShell>
			<PageLayout title={row.doc?.displayName ?? 'Sandbox page'}>
				<PendingScreen row={row} />
			</PageLayout>
		</SandboxShell>
	)
}
