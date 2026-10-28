// Honest placeholder for pinned routes whose port hasn't landed. Records the
// upstream source and exercised API instead of faking coverage — the coverage
// ledger counts these as 'pending', never 'ported'.

import { Text, Heading, VStack, HStack } from '@octane-xplat/ui'
import { blockerFor } from '../coverage/coverage'
import type { CoverageRow } from '../coverage/coverage'

export function PendingScreen(props: { row?: CoverageRow; title?: string }) {
	const row = props.row
	const blocker = row ? blockerFor(row.route) : ''
	return (
		<VStack gap={4} className="sb-pending">
			<HStack gap={2} vAlign="center">
				<Heading level={2}>
					{props.title ?? row?.doc?.displayName ?? row?.name ?? 'Pending port'}
				</Heading>
				<Text className={blocker ? 'sb-status sb-status--blocked' : 'sb-status sb-status--pending'}>
					{blocker ? 'blocked' : 'pending'}
				</Text>
			</HStack>
			<Text type="body" color="secondary">
				This{' '}
				{row?.kind === 'template-block'
					? 'component example'
					: row?.kind === 'template-page'
						? 'page template'
						: 'screen'}{' '}
				is part of the pinned Astryx 0.6.4 baseline but has not been ported to Octane Xplat yet.
			</Text>
			{blocker ? <Text>{blocker}</Text> : null}
			{row?.source ? <Text className="sb-pending-meta">upstream: {row.source}</Text> : null}
			{row?.doc?.componentsUsed?.length ? (
				<Text className="sb-pending-meta">components: {row.doc.componentsUsed.join(', ')}</Text>
			) : null}
			{row?.route ? <Text className="sb-pending-meta">route: {row.route}</Text> : null}
		</VStack>
	)
}
