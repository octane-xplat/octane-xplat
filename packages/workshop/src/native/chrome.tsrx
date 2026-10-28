/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useEffect } from 'octane'
import { useStore } from '@octane-xplat/ui/data'
import type { CatalogEntry } from '../catalog'
import type { WorkshopTarget } from '../contract'
import { UNSET, isUnsettable } from '../controls'
import type { NativeWorkshopController } from './controller'

export interface NativeChromeProps {
	controller: NativeWorkshopController
	target: WorkshopTarget
	/** Hands the stage slot's native view to the host — a separate story root mounts on it. */
	onStage(view: unknown): void
	/** Host focus adapter (View.focus / makeFirstResponder / grab_focus). */
	focus(view: unknown): void
}

const TARGETS = ['web', 'ios', 'android', 'macos', 'windows', 'linux'] as const

function StatusLine(p: { controller: NativeWorkshopController; target: WorkshopTarget }) {
	const s = useStore(p.controller.store)
	const session = s.session
	const entry = s.catalog.find((e) => e.id === s.selectedId)
	const text =
		s.catalogError ||
		`${p.target} · unqualified backend · ${
			s.missingId
				? `Missing story: ${s.missingId}`
				: entry && !entry.applicable
					? `${entry.id}: unsupported-by-story`
					: (session.storyId ?? 'Choose a story')
		} · ${session.phase}${session.stale ? ' · STALE' : ''}${
			session.failure ? ` · ${session.failure.phase}: ${session.failure.message}` : ''
		}`

	return <label className="xw-status" text={text} accessibilityLabel={text} />
}

function Toolbar(p: {
	controller: NativeWorkshopController
	storiesRef: (v: unknown) => void
	controlsRef: (v: unknown) => void
	onToggle(panel: 'stories' | 'controls', opener: unknown): void
}) {
	const s = useStore(p.controller.store)
	const catalogActive =
		!s.stageOnly && (s.mode === 'wide' ? !s.catalogCollapsed : s.panel === 'stories')

	const controlsActive =
		!s.stageOnly && (s.mode === 'wide' ? !s.controlsCollapsed : s.panel === 'controls')

	return (
		<masonview className="xw-toolbar" style={{ display: 'flex', flexWrap: 'wrap' }}>
			{!s.stageOnly ? (
				<>
					<button
						ref={p.storiesRef}
						className={`xw-action${catalogActive ? ' xw-action-active' : ''}`}
						text="Stories"
						accessibilityLabel="Stories"
						onTap={(e: any) => p.onToggle('stories', e?.view ?? null)}
					/>
					<button
						ref={p.controlsRef}
						className={`xw-action${controlsActive ? ' xw-action-active' : ''}`}
						text="Controls"
						accessibilityLabel="Controls"
						onTap={(e: any) => p.onToggle('controls', e?.view ?? null)}
					/>
				</>
			) : null}
			<button
				className="xw-action"
				text="Reset"
				accessibilityLabel="Reset story"
				onTap={() => void p.controller.reset()}
			/>
			<button
				className="xw-action"
				text={s.stageOnly ? 'Return to workshop' : 'Stage only'}
				accessibilityLabel={s.stageOnly ? 'Return to workshop' : 'Stage only'}
				onTap={() => {
					p.controller.stageOnly = !p.controller.stageOnly
					p.controller.panel = null
				}}
			/>
		</masonview>
	)
}

function CatalogGroup(p: {
	controller: NativeWorkshopController
	prefix: string
	items: readonly CatalogEntry[]
	query: string
}) {
	const s = useStore(p.controller.store)
	const groups = new Map<string, CatalogEntry[]>()
	const leaves: CatalogEntry[] = []
	for (const entry of p.items) {
		const depth = p.prefix ? p.prefix.split(' / ').length : 0
		const tail = entry.title
			.split('/')
			.map((part) => part.trim())
			.filter(Boolean)
			.slice(depth)
			.join(' / ')

		const separator = tail.indexOf('/')
		if (separator < 0) {
			leaves.push(entry)
		} else {
			const name = `${p.prefix}${p.prefix ? ' / ' : ''}${tail.slice(0, separator).trim()}`
			const members = groups.get(name) ?? []
			members.push(entry)
			groups.set(name, members)
		}
	}

	return (
		<>
			{leaves.map((entry) => {
				const text = `${entry.title} (${entry.id})${entry.applicable ? '' : ' — unsupported-by-story'}`
				return (
					<button
						key={entry.id}
						className={`xw-action xw-catalog-item${entry.id === s.selectedId ? ' xw-action-active' : ''}`}
						text={text}
						accessibilityLabel={text}
						onTap={() => void p.controller.select(entry.id)}
					/>
				)
			})}
			{[...groups.entries()].map(([name, members]) => {
				const collapsed = s.collapsedGroups.has(name)
				const label = `${collapsed ? 'Expand' : 'Collapse'} ${name}`
				return (
					<masonview key={name} style={{ display: 'flex', flexDirection: 'column' }}>
						<button
							className="xw-action"
							text={label}
							accessibilityLabel={label}
							onTap={() => {
								const next = new Set(s.collapsedGroups)
								if (collapsed) {
									next.delete(name)
								} else {
									next.add(name)
								}

								p.controller.store.update((v) => ({ ...v, collapsedGroups: next }))
							}}
						/>
						{p.query || !collapsed ? (
							<CatalogGroup
								controller={p.controller}
								prefix={name}
								items={members}
								query={p.query}
							/>
						) : null}
					</masonview>
				)
			})}
		</>
	)
}

function CatalogPanel(p: {
	controller: NativeWorkshopController
	searchRef: (v: unknown) => void
	onClose(): void
}) {
	const s = useStore(p.controller.store)
	const query = s.query.toLowerCase()
	const entries = [...s.catalog]
		.filter((e) => `${e.title} ${e.id}`.toLowerCase().includes(query))
		.sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id))

	return (
		<scrollview className="xw-panel">
			<masonview style={{ display: 'flex', flexDirection: 'column' }}>
				<button
					className="xw-action"
					text="Close Stories"
					accessibilityLabel="Close Stories"
					onTap={p.onClose}
				/>
				<textfield
					ref={p.searchRef}
					className="xw-field"
					hint="Find a story by title or ID"
					accessibilityLabel="Search stories"
					text={s.query}
					onTextChange={(e: any) => {
						p.controller.query = String(e?.value ?? e?.object?.text ?? '')
					}}
				/>
				<CatalogGroup controller={p.controller} prefix="" items={entries} query={s.query} />
				{!entries.length ? (
					<label
						className="xw-label"
						text="No stories. Add src/counter.stories.tsrx with an exported defineStory declaration."
						accessibilityLabel="No stories"
					/>
				) : null}
			</masonview>
		</scrollview>
	)
}

function ControlsPanel(p: {
	controller: NativeWorkshopController
	target: WorkshopTarget
	onClose(): void
}) {
	const s = useStore(p.controller.store)
	const story = p.controller.session.currentStory
	const currentProps = p.controller.session.currentProps ?? {}
	const draft = (key: string, value: unknown) =>
		p.controller.store.update((v) => ({
			...v,
			drafts: { ...v.drafts, [key]: String(value) },
		}))

	const commit = (key: string, value: unknown) => p.controller.control(key, value as any)
	return (
		<scrollview className="xw-panel">
			<masonview style={{ display: 'flex', flexDirection: 'column' }}>
				<button
					className="xw-action"
					text="Close Controls"
					accessibilityLabel="Close Controls"
					onTap={p.onClose}
				/>
				{story ? (
					<>
						<label
							className="xw-label"
							text={
								story.capabilities?.length
									? `Required capabilities: ${story.capabilities.join(', ')}. Permissions are not granted by selection.`
									: 'Local story'
							}
							accessibilityLabel="Story capabilities"
						/>
						{Object.entries(story.controls ?? {}).map(([key, control]) => {
							const spec = control as {
								type: string
								options?: readonly (string | number | boolean)[]
							}

							const applied = `${key}: ${String(currentProps[key] ?? 'Unset')}`
							return (
								<masonview key={key} style={{ display: 'flex', flexDirection: 'column' }}>
									<label className="xw-label" text={applied} accessibilityLabel={applied} />
									{spec.type === 'boolean' ? (
										<>
											<button
												className="xw-action"
												text={`${key}: true`}
												accessibilityLabel={`${key}: true`}
												onTap={() => commit(key, true)}
											/>
											<button
												className="xw-action"
												text={`${key}: false`}
												accessibilityLabel={`${key}: false`}
												onTap={() => commit(key, false)}
											/>
										</>
									) : spec.type === 'enum' ? (
										<>
											{(spec.options ?? []).map((option) => (
												<button
													key={String(option)}
													className="xw-action"
													text={`${key}: ${String(option)}`}
													accessibilityLabel={`${key}: ${String(option)}`}
													onTap={() => commit(key, option)}
												/>
											))}
										</>
									) : (
										<>
											<textfield
												className="xw-field"
												accessibilityLabel={key}
												text={s.drafts[key] ?? String(currentProps[key] ?? '')}
												onTextChange={(e: any) => draft(key, e?.value ?? e?.object?.text ?? '')}
											/>
											<button
												className="xw-action"
												text={`Apply ${key}`}
												accessibilityLabel={`Apply ${key}`}
												onTap={() => commit(key, s.drafts[key] ?? String(currentProps[key] ?? ''))}
											/>
										</>
									)}
									{isUnsettable(story, key) ? (
										<button
											className="xw-action"
											text={`Unset ${key}`}
											accessibilityLabel={`Unset ${key}`}
											onTap={() => commit(key, UNSET)}
										/>
									) : null}
									<label
										className="xw-error"
										text={s.errors[key] ?? ''}
										accessibilityLabel={s.errors[key] ?? ''}
									/>
								</masonview>
							)
						})}
					</>
				) : null}
				<label
					className="xw-label"
					text="Targets — launch another actual host from the CLI"
					accessibilityLabel="Targets"
				/>
				{TARGETS.map((target) => {
					const selected = s.catalog.find((e) => e.id === s.selectedId)
					const text = `${target}: ${
						selected && !selected.targets.includes(target)
							? 'unsupported-by-story'
							: 'unqualified backend / separate launch'
					}${target === p.target ? ' (current host)' : ''}`

					return <label key={target} className="xw-label" text={text} accessibilityLabel={text} />
				})}
				<label className="xw-label" text="Stage settings" accessibilityLabel="Stage settings" />
				<button
					className={`xw-action${s.stage.background === 'default' ? ' xw-action-active' : ''}`}
					text="Default background"
					accessibilityLabel="Default background"
					onTap={() =>
						p.controller.store.update((v) => ({
							...v,
							stage: { ...v.stage, background: 'default' },
						}))
					}
				/>
				<button
					className={`xw-action${s.stage.background === 'dark' ? ' xw-action-active' : ''}`}
					text="Dark background"
					accessibilityLabel="Dark background"
					onTap={() =>
						p.controller.store.update((v) => ({
							...v,
							stage: { ...v.stage, background: 'dark' },
						}))
					}
				/>
				<button
					className={`xw-action${s.stage.size === 'available' ? ' xw-action-active' : ''}`}
					text="Available stage size"
					accessibilityLabel="Available stage size"
					onTap={() =>
						p.controller.store.update((v) => ({ ...v, stage: { ...v.stage, size: 'available' } }))
					}
				/>
				<button
					className={`xw-action${s.stage.size === 'bounded' ? ' xw-action-active' : ''}`}
					text="Bounded stage size: 320 × 400"
					accessibilityLabel="Bounded stage size: 320 × 400"
					onTap={() =>
						p.controller.store.update((v) => ({ ...v, stage: { ...v.stage, size: 'bounded' } }))
					}
				/>
			</masonview>
		</scrollview>
	)
}

export function NativeWorkshopChrome(p: NativeChromeProps) {
	const s = useStore(p.controller.store)
	const opener = useRef<unknown>(null)
	const search = useRef<unknown>(null)
	const panel = s.panel
	useEffect(() => {
		if (panel === 'stories' && search.current) {
			p.focus(search.current)
		}

		if (panel === null && opener.current) {
			p.focus(opener.current)
		}
	}, [panel])

	const wide = s.mode === 'wide' && !s.stageOnly
	const phone = s.mode === 'phone'
	const showCatalog = !s.stageOnly && (wide ? !s.catalogCollapsed : s.panel === 'stories')
	const showControls = !s.stageOnly && (wide ? !s.controlsCollapsed : s.panel === 'controls')
	const panelOpen = !s.stageOnly && (showCatalog || showControls)
	// Phone: an open panel overlays the stage — hidden keeps the story root
	// alive; collapse would release it on some drivers.
	const stageHidden = !wide && phone && panelOpen
	const overlayPanel = !wide && phone
	const covered =
		s.session.phase === 'failed' ||
		s.session.phase === 'restart-required' ||
		s.session.phase === 'disconnected'

	const stageStyle: Record<string, unknown> = {
		flexGrow: 1,
		...(s.stage.size === 'bounded' ? { width: 320, height: 400, alignSelf: 'center' } : {}),
		...(s.stage.background === 'dark' ? { backgroundColor: '#242424' } : {}),
		visibility: stageHidden ? 'hidden' : 'visible',
	}

	const closePanel = () => {
		if (wide) {
			p.controller.store.update((v) => ({
				...v,
				catalogCollapsed: panel === 'stories' ? true : v.catalogCollapsed,
				controlsCollapsed: panel === 'controls' ? true : v.controlsCollapsed,
			}))
		}

		p.controller.panel = null
		if (opener.current) {
			p.focus(opener.current)
		}
	}

	return (
		<masonview
			className="xw-root"
			style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}
		>
			<Toolbar
				controller={p.controller}
				storiesRef={(v) => {
					if (v) {
						opener.current = v
					}
				}}
				controlsRef={(v) => {
					if (v) {
						opener.current = v
					}
				}}
				onToggle={(panel, source) => {
					if (source) {
						opener.current = source
					}

					p.controller.toggle(panel)
				}}
			/>
			<label
				className="xw-title"
				text={s.selectedId ?? 'Choose a story'}
				accessibilityLabel={s.selectedId ?? 'Choose a story'}
			/>
			<StatusLine controller={p.controller} target={p.target} />
			<masonview style={{ display: 'flex', flexDirection: 'row', flexGrow: 1 }}>
				{showCatalog ? (
					<masonview
						className="xw-column"
						style={
							overlayPanel
								? { display: 'flex', position: 'absolute', inset: 0 }
								: {
										display: 'flex',
										width: wide ? 240 : undefined,
										flexBasis: wide ? undefined : '45%',
									}
						}
					>
						<CatalogPanel
							controller={p.controller}
							searchRef={(v) => {
								if (v) {
									search.current = v
								}
							}}
							onClose={closePanel}
						/>
					</masonview>
				) : null}
				<masonview
					className="xw-stage-wrap"
					style={{ display: 'flex', flexGrow: 1, position: 'relative' }}
				>
					<masonview
						className="xw-stage"
						ref={(v: unknown) => {
							if (v) {
								p.onStage(v)
							}
						}}
						style={stageStyle}
					/>
					{covered ? (
						<masonview
							className="xw-error-cover"
							style={{
								position: 'absolute',
								inset: 0,
								justifyContent: 'center',
								alignItems: 'center',
							}}
						>
							<label
								className="xw-error"
								text={`Story error: ${s.catalogError || s.session.failure?.message || s.session.phase}`}
								accessibilityLabel={`Story error: ${s.catalogError || s.session.failure?.message || s.session.phase}`}
							/>
						</masonview>
					) : null}
				</masonview>
				{showControls ? (
					<masonview
						className="xw-column"
						style={
							overlayPanel
								? { display: 'flex', position: 'absolute', inset: 0 }
								: {
										display: 'flex',
										width: wide ? 280 : undefined,
										flexBasis: wide ? undefined : '45%',
									}
						}
					>
						<ControlsPanel controller={p.controller} target={p.target} onClose={closePanel} />
					</masonview>
				) : null}
			</masonview>
		</masonview>
	)
}
