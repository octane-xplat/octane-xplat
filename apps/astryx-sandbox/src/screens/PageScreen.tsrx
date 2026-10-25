// Authored /pages/* route screen. Sandbox-group pages render inside the
// sandbox frame; fullscreen-group pages get the PreviewShell chrome
// (embed iframe + toolbar) exactly like upstream's (fullscreen) layout;
// raw-group pages render unframed. ?embed=1 renders the page content bare —
// that is the document the preview iframe loads.

import { View } from '@octane-xplat/ui'
import { routeRow } from '../coverage/coverage'
import { pageFor } from '../pages/registry'
import { isEmbed } from '../theme'
import { PendingScreen } from '../shell/PendingScreen'
import { PreviewShell } from '../shell/PreviewShell'
import { SandboxShell } from '../shell/SandboxShell'
import { PageLayout } from '../shell/PageLayout'
import { NotFoundScreen } from './NotFoundScreen'

export function PageScreen(props: { params: { rest?: string } }) @{
	const route = `/pages/${props.params.rest ?? ''}/`
	const row = routeRow(route)

	if (!row) {
		return <NotFoundScreen title="Not Found" message={`“${route}” is not part of the pinned sandbox route table.`} />
	}

	const page = pageFor(route)

	if (row.group === 'fullscreen') {
		if (isEmbed) return page ?? <PendingScreen row={row} />
		return <PreviewShell row={row}>{page ?? <PendingScreen row={row} />}</PreviewShell>
	}

	if (row.group === 'raw') {
		return page ?? <PendingScreen row={row} />
	}

	return (
		<SandboxShell>
			<PageLayout title={row.doc?.displayName ?? 'Sandbox page'}>
				{page ?? <PendingScreen row={row} />}
			</PageLayout>
		</SandboxShell>
	)
}
