// Port of upstream (sandbox)/templates/page.tsx — the template audit index.
// In this port it doubles as the coverage ledger: every pinned template
// route, its family, upstream source, and honest port status, plus the
// non-template routes in a second ledger.

import { useState } from 'octane'
import { Heading, Text, TextInput, VStack, View, Icon, Layout, LayoutHeader, LayoutContent } from '@octane-xplat/ui'
import { coverageRows, coverageSummary, familyRows, type CoverageRow } from '../coverage/coverage'
import { SandboxShell } from '../shell/SandboxShell'
import { SandboxLink } from '../shell/SandboxLink'

function StatusBadge(props: { status: CoverageRow['status'] }) @{
	return <Text className={`sb-status sb-status--${props.status}`}>{props.status}</Text>
}

function LedgerRow(props: { row: CoverageRow }) @{
	const row = props.row
	return (
		<tr>
			<td>
				<SandboxLink href={row.route}>{row.doc?.displayName ?? row.name ?? row.route}</SandboxLink>
			</td>
			<td>{row.kind === 'template-block' ? 'block' : row.kind === 'template-page' ? 'page' : row.kind}</td>
			<td>{row.family ?? '—'}</td>
			<td>
				<StatusBadge status={row.status} />
			</td>
			<td className="sb-pending-meta">{row.source ?? '—'}</td>
		</tr>
	)
}

export function TemplatesIndexScreen() @{
	const [search, setSearch] = useState('')
	const summary = coverageSummary()
	const q = search.trim().toLowerCase()
	const match = (row: CoverageRow) =>
		!q ||
		row.route.toLowerCase().includes(q) ||
		(row.doc?.displayName ?? '').toLowerCase().includes(q) ||
		(row.family ?? '').toLowerCase().includes(q)

	const families = familyRows().map((f) => ({ ...f, rows: f.rows.filter(match) })).filter((f) => f.rows.length > 0)
	const pageTemplates = coverageRows.filter((r) => r.kind === 'template-page' && match(r))
	const otherRoutes = coverageRows.filter(
		(r) => r.kind !== 'template-block' && r.kind !== 'template-page' && r.route !== '/templates/' && match(r),
	)

	return (
		<SandboxShell>
			<Layout
				header={
					<LayoutHeader hasDivider padding={6}>
						<Heading level={1}>{'Templates'}</Heading>
					</LayoutHeader>
				}
				content={
					<LayoutContent padding={6}>
						<VStack gap={4}>
							<Text className="sb-type-body sb-color-secondary">
								Pinned Astryx 0.6.4 baseline: {summary.total} routes — {summary.ported} ported,{' '}
								{summary.pending} pending, {summary.blocked} blocked.
							</Text>
							<TextInput
								label="Search templates"
								isLabelHidden
								placeholder="Search templates…"
								value={search}
								onChange={setSearch}
								startIcon={<Icon name="sandbox-search" size={16} />}
								hasClear
								width={240}
								size="sm"
							/>

							{families.map((family) => (
								<View key={family.family}>
									<Heading level={2} className="sb-family-heading">
										{family.family} ({family.rows.filter((r) => r.status === 'ported').length}/{family.rows.length})
									</Heading>
									<table className="sb-ledger-table">
										<thead>
											<tr>
												<th>Example</th>
												<th>Kind</th>
												<th>Family</th>
												<th>Status</th>
												<th>Upstream source</th>
											</tr>
										</thead>
										<tbody>
											{family.rows.map((row) => (
												<LedgerRow key={row.route} row={row} />
											))}
										</tbody>
									</table>
								</View>
							))}

							<Heading level={2} className="sb-family-heading">
								Page templates ({pageTemplates.filter((r) => r.status === 'ported').length}/{pageTemplates.length})
							</Heading>
							<table className="sb-ledger-table">
								<thead>
									<tr>
										<th>Template</th>
										<th>Kind</th>
										<th>Family</th>
										<th>Status</th>
										<th>Upstream source</th>
									</tr>
								</thead>
								<tbody>
									{pageTemplates.map((row) => (
										<LedgerRow key={row.route} row={row} />
									))}
								</tbody>
							</table>

							<Heading level={2} className="sb-family-heading">
								Sandbox routes
							</Heading>
							<table className="sb-ledger-table">
								<thead>
									<tr>
										<th>Route</th>
										<th>Kind</th>
										<th>Family</th>
										<th>Status</th>
										<th>Upstream source</th>
									</tr>
								</thead>
								<tbody>
									{otherRoutes.map((row) => (
										<LedgerRow key={row.route} row={row} />
									))}
								</tbody>
							</table>
						</VStack>
					</LayoutContent>
				}
			/>
		</SandboxShell>
	)
}
