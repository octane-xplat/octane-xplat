/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useEffect, useState } from 'octane'
import { useStore } from '@octane-xplat/ui/data'
import type { CatalogEntry } from '../catalog'
import { WORKSHOP_TARGETS, type WorkshopTarget } from '../contract'
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

// Mason layout mode and overlay offsets stay in the style channel: the NativeScript
// stylesheet registry cannot express them. All other static styles live in CSS.

/** Draw our own chrome instead of inheriting three different OS button bezels. */
function ChromeButton(p: {
	text: string
	accessibilityLabel?: string
	className?: string
	active?: boolean
	expanded?: boolean
	disabled?: boolean
	onRef?: (view: unknown) => void
	onPress(): void
}) {
	const [pressed, setPressed] = useState(false)
	return (
		<masonview
			style={{ display: 'flex' }}
			ref={p.onRef}
			className={`xw-action ${p.className ?? ''}${p.active ? ' xw-action-active' : ''}${p.disabled ? ' xw-action-disabled' : ''}${pressed ? ' xw-action-pressed' : ''}`}
			accessible
			accessibilityRole="button"
			accessibilityLabel={p.accessibilityLabel ?? p.text}
			accessibilityState={{ pressed: p.active, expanded: p.expanded, disabled: p.disabled }}
			onTap={p.disabled ? undefined : p.onPress}
			onTouch={p.disabled ? undefined : (e: any) => setPressed(e.action === 'down')}
		>
			<label
				className="xw-action-label"
				text={p.text}
				maxLines={1}
				whiteSpace="nowrap"
				textOverflow="ellipsis"
			/>
		</masonview>
	)
}

function Toolbar(p: {
	controller: NativeWorkshopController
	target: WorkshopTarget
	onToggle(panel: 'stories' | 'controls', opener: unknown): void
}) {
	const s = useStore(p.controller.store)
	const stories = useRef<unknown>(null)
	const controls = useRef<unknown>(null)
	const catalogActive =
		!s.stageOnly && (s.mode === 'wide' ? !s.catalogCollapsed : s.panel === 'stories')

	const controlsActive =
		!s.stageOnly && (s.mode === 'wide' ? !s.controlsCollapsed : s.panel === 'controls')

	return (
		<masonview style={{ display: 'flex' }} className="xw-toolbar">
			<masonview style={{ display: 'flex' }} className="xw-toolbar-context">
				<label className="xw-wordmark" text="Workshop" />
				<label
					className="xw-target"
					text={p.target}
					accessibilityLabel={`Current host: ${p.target}`}
				/>
			</masonview>
			<masonview style={{ display: 'flex' }} className="xw-toolbar-actions">
				{!s.stageOnly ? (
					<>
						<ChromeButton
							text="Stories"
							active={catalogActive}
							onRef={(v) => {
								stories.current = v
							}}
							onPress={() => p.onToggle('stories', stories.current)}
						/>
						<ChromeButton
							text="Controls"
							active={controlsActive}
							onRef={(v) => {
								controls.current = v
							}}
							onPress={() => p.onToggle('controls', controls.current)}
						/>
						<masonview style={{ display: 'flex' }} className="xw-toolbar-divider" />
					</>
				) : null}
				<ChromeButton
					text="Reset"
					accessibilityLabel="Reset story"
					disabled={
						!s.selectedId || s.session.phase === 'preparing' || s.session.phase === 'mounting'
					}
					onPress={() => void p.controller.reset()}
				/>
				<ChromeButton
					text={s.stageOnly ? 'Return to workshop' : 'Stage only'}
					onPress={() => {
						p.controller.stageOnly = !p.controller.stageOnly
						p.controller.panel = null
					}}
				/>
			</masonview>
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
		const parts = entry.title
			.split('/')
			.map((part) => part.trim())
			.filter(Boolean)
			.slice(depth)

		if (parts.length <= 1) {
			leaves.push(entry)
		} else {
			const name = `${p.prefix}${p.prefix ? ' / ' : ''}${parts[0]}`
			const members = groups.get(name) ?? []
			members.push(entry)
			groups.set(name, members)
		}
	}

	return (
		<>
			{[...groups.entries()].map(([name, members]) => {
				const open = Boolean(p.query) || !s.collapsedGroups.has(name)
				return (
					<masonview style={{ display: 'flex' }} key={name} className="xw-catalog-group">
						<ChromeButton
							className="xw-group-head"
							text={`${open ? '▾' : '▸'}  ${name.split(' / ').pop()}`}
							accessibilityLabel={`${open ? 'Collapse' : 'Expand'} ${name}`}
							expanded={open}
							onPress={() => {
								const next = new Set(s.collapsedGroups)
								if (next.has(name)) {
									next.delete(name)
								} else {
									next.add(name)
								}

								p.controller.store.update((v) => ({ ...v, collapsedGroups: next }))
							}}
						/>
						{open ? (
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
			{leaves.map((entry) => (
				<ChromeButton
					key={entry.id}
					className="xw-catalog-item"
					text={`${entry.title.split('/').pop()?.trim() || entry.title}${entry.applicable ? '' : ' · unavailable'}`}
					accessibilityLabel={`${entry.title} (${entry.id})${entry.applicable ? '' : ` — ${entry.reason ?? 'unsupported by this story'}`}`}
					active={entry.id === s.selectedId}
					disabled={!entry.applicable || !entry.load}
					onPress={() => void p.controller.select(entry.id)}
				/>
			))}
		</>
	)
}

function CatalogPanel(p: {
	controller: NativeWorkshopController
	searchRef: (v: unknown) => void
	onClose(): void
}) {
	const s = useStore(p.controller.store)
	const query = s.query.trim().toLowerCase()
	const entries = [...s.catalog]
		.filter((e) => `${e.title} ${e.id}`.toLowerCase().includes(query))
		.sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id))

	return (
		<masonview style={{ display: 'flex' }} className="xw-panel">
			<masonview style={{ display: 'flex' }} className="xw-panel-head">
				<label className="xw-panel-title" text="Stories" />
				<label className="xw-count" text={String(entries.length)} />
				<masonview style={{ display: 'flex' }} className="xw-spacer" />
				<ChromeButton
					className="xw-close"
					text="×"
					accessibilityLabel="Close Stories"
					onPress={p.onClose}
				/>
			</masonview>
			<masonview style={{ display: 'flex' }} className="xw-search-wrap">
				<textfield
					ref={p.searchRef}
					className="xw-input xw-search"
					hint="Search stories"
					accessibilityLabel="Search stories"
					text={s.query}
					onTextChange={(e: any) => {
						p.controller.query = String(e?.value ?? e?.object?.text ?? '')
					}}
				/>
			</masonview>
			<scrollview className="xw-panel-scroll">
				<masonview style={{ display: 'flex' }} className="xw-catalog-body">
					{s.catalogError ? <label className="xw-error" text={s.catalogError} textWrap /> : null}
					<CatalogGroup controller={p.controller} prefix="" items={entries} query={query} />
					{!entries.length ? (
						<label
							className="xw-empty"
							text={
								s.catalog.length
									? 'No matching stories. Try another title or ID.'
									: 'No stories yet. Add an exported defineStory declaration in a .stories.tsrx file.'
							}
							textWrap
						/>
					) : null}
				</masonview>
			</scrollview>
		</masonview>
	)
}

function ControlsPanel(p: {
	controller: NativeWorkshopController
	target: WorkshopTarget
	onClose(): void
}) {
	const s = useStore(p.controller.store)
	const [showHost, setShowHost] = useState(false)
	const story = p.controller.session.currentStory
	const currentProps = p.controller.session.currentProps ?? {}
	const controls = Object.entries(story?.controls ?? {})
	const disabled = s.session.phase !== 'ready'
	const commit = (key: string, value: unknown) => p.controller.control(key, value as any)
	return (
		<masonview style={{ display: 'flex' }} className="xw-panel">
			<masonview style={{ display: 'flex' }} className="xw-panel-head">
				<label className="xw-panel-title" text="Controls" />
				<masonview style={{ display: 'flex' }} className="xw-spacer" />
				<ChromeButton
					className="xw-close"
					text="×"
					accessibilityLabel="Close Controls"
					onPress={p.onClose}
				/>
			</masonview>
			<scrollview className="xw-panel-scroll">
				<masonview style={{ display: 'flex' }} className="xw-inspector-body">
					<label className="xw-section-title" text="Properties" />
					{!controls.length ? (
						<label
							className="xw-empty"
							text={
								story
									? 'This story has no editable properties.'
									: 'Choose a story to edit its properties.'
							}
							textWrap
						/>
					) : null}
					{controls.map(([key, control]) => {
						const spec = control as {
							type: string
							options?: readonly (string | number | boolean)[]
						}

						const options = spec.type === 'boolean' ? [true, false] : (spec.options ?? [])
						return (
							<masonview style={{ display: 'flex' }} key={key} className="xw-control-field">
								<masonview style={{ display: 'flex' }} className="xw-field-head">
									<label className="xw-field-name" text={key} />
									<masonview style={{ display: 'flex' }} className="xw-spacer" />
									<label
										className="xw-field-type"
										text={key in currentProps ? spec.type : 'unset'}
									/>
								</masonview>
								<masonview style={{ display: 'flex' }} className="xw-choice-row">
									{spec.type === 'boolean' || spec.type === 'enum' ? (
										options.map((option) => (
											<ChromeButton
												key={String(option)}
												className="xw-choice"
												text={String(option)}
												accessibilityLabel={`${key}: ${String(option)}`}
												active={currentProps[key] === option}
												disabled={disabled}
												onPress={() => commit(key, option)}
											/>
										))
									) : (
										<>
											<textfield
												className="xw-input xw-control-input"
												accessibilityLabel={key}
												editable={!disabled}
												text={s.drafts[key] ?? String(currentProps[key] ?? '')}
												onTextChange={(e: any) =>
													p.controller.store.update((v) => ({
														...v,
														drafts: {
															...v.drafts,
															[key]: String(e?.value ?? e?.object?.text ?? ''),
														},
													}))
												}
											/>
											<ChromeButton
												text="Apply"
												className="xw-choice"
												accessibilityLabel={`Apply ${key}`}
												disabled={disabled}
												onPress={() =>
													commit(key, s.drafts[key] ?? String(currentProps[key] ?? ''))
												}
											/>
										</>
									)}
									{story && isUnsettable(story, key) && key in currentProps ? (
										<ChromeButton
											text="Unset"
											accessibilityLabel={`Unset ${key}`}
											disabled={disabled}
											onPress={() => commit(key, UNSET)}
										/>
									) : null}
								</masonview>
								{s.errors[key] ? (
									<label
										className="xw-error"
										text={s.errors[key]}
										accessibilityLabel={s.errors[key]}
										textWrap
									/>
								) : null}
							</masonview>
						)
					})}
					<masonview style={{ display: 'flex' }} className="xw-inspector-section">
						<label className="xw-section-title" text="Preview" />
						<label className="xw-field-name" text="Background" />
						<masonview style={{ display: 'flex' }} className="xw-choice-row">
							{(['default', 'dark'] as const).map((background) => (
								<ChromeButton
									key={background}
									className="xw-choice"
									text={background === 'default' ? 'Default' : 'Dark'}
									accessibilityLabel={`${background === 'default' ? 'Default' : 'Dark'} background`}
									active={s.stage.background === background}
									onPress={() =>
										p.controller.store.update((v) => ({ ...v, stage: { ...v.stage, background } }))
									}
								/>
							))}
						</masonview>
						<label className="xw-field-name" text="Size" />
						<masonview style={{ display: 'flex' }} className="xw-choice-row">
							{(['available', 'bounded'] as const).map((size) => (
								<ChromeButton
									key={size}
									className="xw-choice"
									text={size === 'available' ? 'Fill' : '320 × 400'}
									accessibilityLabel={
										size === 'available' ? 'Available stage size' : 'Bounded stage size: 320 × 400'
									}
									active={s.stage.size === size}
									onPress={() =>
										p.controller.store.update((v) => ({ ...v, stage: { ...v.stage, size } }))
									}
								/>
							))}
						</masonview>
					</masonview>
					<masonview style={{ display: 'flex' }} className="xw-inspector-section">
						<ChromeButton
							className="xw-group-head"
							text={`${showHost ? '▾' : '▸'}  Host details`}
							expanded={showHost}
							onPress={() => setShowHost(!showHost)}
						/>
						{showHost ? (
							<masonview style={{ display: 'flex' }} className="xw-host-details">
								<label
									className="xw-meta"
									text={`${p.target} · experimental host, not runtime-qualified`}
									textWrap
								/>
								<label className="xw-meta" text={s.selectedId ?? 'No story selected'} textWrap />
								{story?.capabilities?.length ? (
									<label
										className="xw-meta"
										text={`Requires ${story.capabilities.join(', ')}. Selection does not grant permissions.`}
										textWrap
									/>
								) : null}
								<label className="xw-meta" text="Other targets open in a separate host." />
								{WORKSHOP_TARGETS.map((target) => {
									const selected = s.catalog.find((e) => e.id === s.selectedId)
									const text = `${target} · ${target === p.target ? 'current host' : selected && !selected.targets.includes(target) ? 'unsupported by this story' : 'separate launch; unqualified'}`
									return <label key={target} className="xw-meta" text={text} textWrap />
								})}
							</masonview>
						) : null}
					</masonview>
				</masonview>
			</scrollview>
		</masonview>
	)
}

function PreviewHeading(p: { controller: NativeWorkshopController }) {
	const s = useStore(p.controller.store)
	const entry = s.catalog.find((e) => e.id === s.selectedId)
	const parts =
		entry?.title
			.split('/')
			.map((part) => part.trim())
			.filter(Boolean) ?? []

	const phase = s.session.phase === 'ready' ? 'Ready' : s.session.phase.replaceAll('-', ' ')
	return (
		<masonview style={{ display: s.stageOnly ? 'none' : 'flex' }} className="xw-preview-head">
			<masonview style={{ display: 'flex' }} className="xw-preview-heading">
				<label className="xw-breadcrumb" text={parts.slice(0, -1).join(' / ') || 'Preview'} />
				<label
					className="xw-preview-title"
					text={parts.at(-1) ?? s.missingId ?? 'Choose a story'}
				/>
			</masonview>
			<label
				className={`xw-phase${s.session.failure ? ' xw-phase-error' : ''}`}
				text={`${phase}${s.session.stale ? ' · stale' : ''}`}
				accessibilityLiveRegion="polite"
			/>
		</masonview>
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
	const showCatalog = !s.stageOnly && (wide ? !s.catalogCollapsed : panel === 'stories')
	const showControls = !s.stageOnly && (wide ? !s.controlsCollapsed : panel === 'controls')
	// Hidden preserves the separate story root while a phone panel covers it.
	const stageHidden = !wide && phone && (showCatalog || showControls)
	const overlayPanel = !wide && phone
	const covered = ['failed', 'restart-required', 'disconnected'].includes(s.session.phase)
	const entry = s.catalog.find((e) => e.id === s.selectedId)
	const notice = s.missingId
		? `Story ${s.missingId} was not found. Choose another story.`
		: entry && !entry.applicable
			? (entry.reason ?? 'This story is unavailable on this host.')
			: covered
				? s.catalogError || s.session.failure?.message || s.session.phase
				: !s.selectedId
					? 'Choose a story from the catalog to start.'
					: ''

	const closePanel = (name: 'stories' | 'controls') => {
		if (wide) {
			p.controller.store.update((v) => ({
				...v,
				[name === 'stories' ? 'catalogCollapsed' : 'controlsCollapsed']: true,
			}))
		}

		p.controller.panel = null
		if (opener.current) {
			p.focus(opener.current)
		}
	}

	// Keep the preview hosts keyed and mounted as panels and headings change.
	return (
		<masonview
			style={{ display: 'flex' }}
			className={`xw-root xw-${s.mode}${p.target === 'ios' || p.target === 'android' ? ' xw-touch' : ''}${s.stageOnly ? ' xw-stageonly' : ''}`}
		>
			<Toolbar
				controller={p.controller}
				target={p.target}
				onToggle={(name, source) => {
					if (source) {
						opener.current = source
					}

					p.controller.toggle(name)
				}}
			/>
			<masonview style={{ display: 'flex', position: 'relative' }} className="xw-body">
				{showCatalog ? (
					<masonview
						key="catalog"
						style={{
							display: 'flex',
							...(overlayPanel
								? { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }
								: {}),
						}}
						className={`xw-column xw-catalog${overlayPanel ? ' xw-overlay' : ''}`}
					>
						<CatalogPanel
							controller={p.controller}
							searchRef={(v) => {
								search.current = v
							}}
							onClose={() => closePanel('stories')}
						/>
					</masonview>
				) : null}
				<masonview
					key="preview"
					className="xw-stage-wrap"
					style={{ display: 'flex' }}
					visibility={stageHidden ? 'hidden' : 'visible'}
				>
					<PreviewHeading controller={p.controller} />
					<masonview
						key="viewport"
						style={{ display: 'flex', position: 'relative' }}
						className="xw-stage-viewport"
					>
						<masonview
							key="frame"
							style={{ display: 'flex' }}
							className={`xw-preview-frame${s.stage.size === 'bounded' ? ' xw-preview-bounded' : ''}`}
						>
							<masonview
								key="story"
								style={{ display: 'flex' }}
								className={`xw-stage${s.stage.background === 'dark' ? ' xw-background-dark' : ''}`}
								ref={(v: unknown) => {
									if (v) {
										p.onStage(v)
									}
								}}
							/>
						</masonview>
						{notice ? (
							<masonview
								style={{
									display: 'flex',
									position: 'absolute',
									top: 0,
									right: 0,
									bottom: 0,
									left: 0,
								}}
								className="xw-notice-cover"
							>
								<masonview style={{ display: 'flex' }} className="xw-notice">
									<label
										className={covered ? 'xw-error' : 'xw-empty'}
										text={notice}
										accessibilityLabel={notice}
										textWrap
									/>
								</masonview>
							</masonview>
						) : null}
					</masonview>
				</masonview>
				{showControls ? (
					<masonview
						key="controls"
						style={{
							display: 'flex',
							...(overlayPanel
								? { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }
								: {}),
						}}
						className={`xw-column xw-controls${overlayPanel ? ' xw-overlay' : ''}`}
					>
						<ControlsPanel
							controller={p.controller}
							target={p.target}
							onClose={() => closePanel('controls')}
						/>
					</masonview>
				) : null}
			</masonview>
		</masonview>
	)
}
