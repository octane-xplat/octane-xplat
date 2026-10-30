/** @jsxImportSource @octane-xplat/jsx/dom */
import { useTranslator } from '../../internal/platform/internationalization'
import { useEffect, useId, useRef } from 'octane'
import type { SelectViewProps } from './select-view'
import { Icon } from '../media/Icon.web.tsrx'
import { Popover } from '../overlays/Popover.web.tsrx'
import { BottomSheet } from '../overlays/BottomSheet.web.tsrx'
import { useMediaQuery } from '../../internal/platform/use-media-query.web'
import { CheckIndicator, CheckboxIndicator } from '../feedback/indicators'
import { useIndicator } from '../feedback/use-indicator'
import { cx } from '@octane-xplat/lib'
import type { JSX } from 'octane/jsx-runtime'

/** Select presentation — resolved finite-list state in, user intents out.
 *  Owns trigger/option focus, keyboard navigation, and type-ahead matching;
 *  internal only — consumers use `Select`. */
export function SelectView(props: SelectViewProps): JSX.Element @{
	const translate = useTranslator()
	const anchor = useRef<HTMLDivElement | null>(null)
	const search = useRef<HTMLInputElement | null>(null)
	const generatedId = useId()
	const listId = `${generatedId}-list`
	const match = useRef({ text: '', at: 0 })
	const focusSearch = useRef(true)
	const CheckInd = useIndicator('check') ?? CheckIndicator
	const coarse = useMediaQuery('(pointer: coarse)')
	const asSheet =
		props.presentation === 'bottom-sheet' || (props.presentation === 'adaptive' && coarse)

	const MultiInd = useIndicator('checkbox') ?? CheckboxIndicator
	const busy = Boolean(props.isLoading || props.pending)
	const blocked = Boolean(props.isDisabled || props.isReadOnly)
	const active = props.enabled.find((option) => option.value === props.activeValue)

	const optionId = (value: string) =>
		`${listId}-${props.options.findIndex((option) => option.value === value)}`

	const close = (restore = true) => {
		props.onOpenChange(false)
		props.onActiveValueChange?.(null)
		match.current.text = ''
		if (restore) {
			anchor.current?.focus({ preventScroll: true })
		}
	}

	useEffect(() => {
		if (!props.open) {
			focusSearch.current = true
			match.current.text = ''
		}
	}, [props.open])

	useEffect(() => {
		if (props.open && active) {
			document.getElementById(optionId(active.value))?.scrollIntoView?.({ block: 'nearest' })
		}
	}, [props.open, active?.value])

	const onKey = (event: KeyboardEvent, editing = false) => {
		if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || blocked) {
			return
		}

		if (
			props.open &&
			props.multiple &&
			props.hasSelectAll &&
			(event.ctrlKey || event.metaKey) &&
			event.key.toLowerCase() === 'a'
		) {
			event.preventDefault()
			props.onSelectAll()
			return
		}

		const index = props.enabled.findIndex((option) => option.value === active?.value)
		const move = (next: number) => {
			event.preventDefault()
			if (!props.open) {
				props.onOpenChange(true)
			}

			props.onActiveValueChange?.(
				props.enabled[Math.max(0, Math.min(next, props.enabled.length - 1))]?.value ?? null,
			)
		}

		switch (event.key) {
			case 'ArrowDown':
				move(props.open ? index + 1 : Math.max(index, 0))
				return
			case 'ArrowUp':
				move(props.open ? index - 1 : props.enabled.length - 1)
				return
			case 'Home':
				if (!editing && props.open) {
					move(0)
				}

				return
			case 'End':
				if (!editing && props.open) {
					move(props.enabled.length - 1)
				}

				return
			case 'PageUp':
				if (props.open) {
					move(0)
				}

				return
			case 'PageDown':
				if (props.open) {
					move(props.enabled.length - 1)
				}

				return
			case 'Enter':
			case ' ':
				if (event.key === ' ' && editing) {
					return
				}

				event.preventDefault()
				if (!props.open) {
					props.onOpenChange(true)
				} else if (active && !props.pending) {
					props.onPick(active)
					if (!props.multiple) {
						anchor.current?.focus({ preventScroll: true })
					}
				}

				return
			case 'Escape':
				if (props.open) {
					event.preventDefault()
					event.stopPropagation()
					close()
				}

				return
			case 'Tab':
				if (props.open) {
					if (event.target === search.current && props.query && !event.shiftKey) {
						return
					}

					close()
					if (editing && event.shiftKey) {
						event.preventDefault()
					}
				}

				return
			case 'Backspace':
			case 'Delete':
				if (!editing && !props.open && props.hasClear) {
					event.preventDefault()
					props.onClear()
				}

				return
		}

		if (editing || event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
			return
		}

		event.preventDefault()
		if (props.searchable) {
			props.onQueryChange(event.key)
			props.onOpenChange(true)
			return
		}

		const now = Date.now()
		const previous = now - match.current.at < 500 ? match.current.text : ''
		const text = previous + event.key.toLowerCase()
		match.current = { text, at: now }
		const repeated = [...text].every((char) => char === text[0])
		const prefix = repeated ? text[0] : text
		const start = repeated ? index + 1 : 0
		const ordered = [...props.enabled.slice(start), ...props.enabled.slice(0, start)]
		const option = ordered.find((item) =>
			(item.label ?? item.value).toLowerCase().startsWith(prefix),
		)

		if (option) {
			props.onActiveValueChange?.(option.value)
			if (!props.open && !props.multiple) {
				props.onPick(option)
			} else {
				props.onOpenChange(true)
			}
		}
	}

	<>
		<div
			ref={(element: any) => {
				anchor.current = element
			}}
			id={props.id}
			role={!props.searchable || props.isReadOnly ? 'combobox' : 'button'}
			tabIndex={props.isDisabled && !props.disabledMessage ? -1 : 0}
			className={cx(
				'vx-select-trigger',
				props.variant === 'ghost' && 'vx-select--ghost',
				props.isDisabled && 'vx-select--disabled',
				props.isReadOnly && 'vx-select--readonly',
				busy && 'vx-select--loading',
				props.status && `vx-select--status-${props.status.type}`,
				props.size && `vx-select--size-${props.size}`,
				props.className,
			)}
			style={props.style}
			aria-label={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
			aria-labelledby={props.ariaLabelledBy}
			aria-describedby={props.ariaDescribedBy}
			aria-description={props.ariaDescription}
			aria-disabled={props.isDisabled || undefined}
			aria-readonly={props.isReadOnly || undefined}
			aria-busy={busy || undefined}
			aria-required={(props.isRequired && !props.isOptional) || undefined}
			aria-invalid={props.status?.type === 'error' || undefined}
			aria-haspopup="listbox"
			aria-expanded={props.open}
			aria-controls={props.open ? listId : undefined}
			aria-activedescendant={
				props.open && !props.searchable && active ? optionId(active.value) : undefined
			}
			title={props.isDisabled ? props.disabledMessage : undefined}
			onClick={() => (props.open ? close() : props.onOpenChange(true))}
			onKeyDown={(event: KeyboardEvent) => {
				if (event.target === event.currentTarget) {
					onKey(event)
				}
			}}
		>
			{props.multiple && props.triggerDisplay === 'badges' && props.selected.length ? (
				<span className="vx-select-badges">
					{props.selected.map((v) => {
						const o = props.options.find((x) => x.value === v)
						return (
							<span key={v} className="vx-select-badge">
								<span>{o?.label ?? v}</span>
								<button
									type="button"
									className="vx-select-badge-x"
									aria-label={`Remove ${o?.label ?? v}`}
									onClick={(e: MouseEvent) => {
										e.stopPropagation()
										if (o) {
											props.onPick(o)
										}
									}}
								>
									<Icon name="xplat-clear" size={12} />
								</button>
							</span>
						)
					})}
				</span>
			) : props.renderValue && props.selected.length && !props.multiple ? (
				<span className={cx('vx-select-value')}>
					{props.renderValue(props.options.find((o) => o.value === props.selected[0])!)}
				</span>
			) : (
				<span className={cx('vx-select-value', !props.selected.length && 'vx-select-placeholder')}>
					{props.triggerText}
				</span>
			)}
			{props.hasClear && props.selected.length && !blocked ? (
				<button
					type="button"
					className="vx-select-clear"
					aria-label={translate('@astryx.selector.clearLabel')}
					disabled={props.pending}
					onClick={(event: MouseEvent) => {
						event.stopPropagation()
						props.onClear()
						anchor.current?.focus()
					}}
				>
					<Icon name="xplat-clear" size={12} />
				</button>
			) : null}
			{busy ? (
				<span className="vx-select-loading" role="status">
					Loading…
				</span>
			) : null}
			{!props.isReadOnly ? (
				<Icon name="xplat-chevron-down" className="vx-select-caret" size={14} />
			) : null}
		</div>
		{props.htmlName
			? props.selected.map((value) => (
					<input
						key={value}
						type="hidden"
						name={props.htmlName}
						value={value}
						disabled={props.isDisabled}
					/>
				))
			: null}
		<span className="vx-sr-only" role="status" aria-live="polite">
			{props.announcement}
		</span>
		<Popover
			anchor={anchor}
			open={props.open && !asSheet}
			placement={props.placement ?? 'bottom'}
			onDismiss={() => close()}
			className="vx-menu"
		>
			{props.searchable ? (
				<div className="vx-select-search-row">
					<input
						ref={(element: any) => {
							search.current = element
							if (element && focusSearch.current) {
								focusSearch.current = false
								element.focus()
							}
						}}
						id={props.id ? `${props.id}-search` : undefined}
						className="vx-input vx-select-search"
						role="combobox"
						aria-label={translate('@astryx.selector.searchOptions')}
						aria-expanded={props.open}
						aria-controls={listId}
						aria-autocomplete="list"
						aria-activedescendant={active ? optionId(active.value) : undefined}
						placeholder={props.searchPlaceholder ?? translate('@astryx.selector.searchPlaceholder')}
						value={props.query}
						onInput={(event: any) => {
							props.onActiveValueChange?.(null)
							props.onQueryChange(event.target.value)
						}}
						onKeyDown={(event: KeyboardEvent) => onKey(event, true)}
					/>
					{props.query ? (
						<button
							type="button"
							className="vx-select-search-clear"
							aria-label="Clear search"
							onClick={() => {
								props.onQueryChange('')
								search.current?.focus()
							}}
							onKeyDown={(event: KeyboardEvent) => onKey(event, true)}
						>
							<Icon name="xplat-clear" size={12} />
						</button>
					) : null}
				</div>
			) : null}
			{props.multiple && props.hasSelectAll ? (
				<button
					type="button"
					id={props.id ? `${props.id}-select-all` : undefined}
					className="vx-select-all"
					disabled={props.pending || !props.enabled.length}
					aria-label={props.selectAllLabel ?? 'Select all'}
					aria-pressed={
						props.selectAllState === 'indeterminate' ? 'mixed' : props.selectAllState === 'checked'
					}
					onClick={props.onSelectAll}
				>
					<MultiInd state={props.selectAllState} />
					<span>{props.selectAllLabel ?? 'Select all'}</span>
				</button>
			) : null}
			<div
				id={listId}
				role="listbox"
				aria-label={props.label ?? props.accessibilityLabel ?? 'Options'}
				aria-multiselectable={props.multiple || undefined}
				aria-busy={busy || undefined}
				className="vx-menu-list vx-select-list"
				style={{ maxHeight: props.maxMenuHeight ?? 280 }}
			>
				{!props.shown.length && !busy ? (
					<div role="presentation" className="vx-select-empty">
						{props.emptyText}
					</div>
				) : null}
				{props.groups.map((group, index) => {
					const rows = group.options.map((option) => (
						<div
							key={option.value}
							id={optionId(option.value)}
							role="option"
							aria-selected={props.selected.includes(option.value)}
							aria-disabled={option.isDisabled || props.pending || undefined}
							className={cx(
								'vx-menu-item',
								'vx-select-option',
								props.selected.includes(option.value) && 'vx-select-option--on',
								active?.value === option.value && 'vx-select-option--highlighted',
								option.isDisabled && 'vx-menu-item--disabled',
							)}
							onMouseDown={(event: MouseEvent) => event.preventDefault()}
							onMouseEnter={() => {
								if (!option.isDisabled) {
									props.onActiveValueChange?.(option.value)
								}
							}}
							onClick={() => {
								props.onPick(option)
								if (!props.multiple && !option.isDisabled) {
									anchor.current?.focus()
								}
							}}
						>
							<span className="vx-select-check" aria-hidden="true">
								{props.multiple ? (
									<MultiInd
										state={props.selected.includes(option.value) ? 'checked' : 'unchecked'}
										isDisabled={option.isDisabled}
									/>
								) : (
									<CheckInd
										state={props.selected.includes(option.value) ? 'checked' : 'unchecked'}
										isDisabled={option.isDisabled}
									/>
								)}
							</span>
							{props.renderOption ? (
								props.renderOption(option)
							) : (
								<>
									{option.icon != null ? (
										<span className="vx-select-option-icon" aria-hidden="true">
											{option.icon}
										</span>
									) : null}
									<span className="vx-menu-item-label">
										{option.label ?? option.value}
										{option.description ? (
											<span className="vx-select-description">{option.description}</span>
										) : null}
									</span>
								</>
							)}
						</div>
					))

					return group.heading == null ? (
						rows
					) : (
						<div key={index} role="group" aria-label={group.heading}>
							<div className="vx-select-group" aria-hidden="true">
								{group.heading}
							</div>
							{rows}
						</div>
					)
				})}
			</div>
		</Popover>
		{asSheet ? (
			<BottomSheet
				isOpen={props.open}
				onOpenChange={() => close()}
				label={props.label ?? 'Options'}
				height="hug"
				className="vx-select-sheet"
			>
				<div
					role="listbox"
					aria-label={props.label ?? 'Options'}
					className="vx-menu-list vx-select-list"
				>
					{props.groups.map((group, index) =>
						group.heading == null ? (
							group.options.map((option) => (
								<div
									key={option.value}
									role="option"
									aria-selected={props.selected.includes(option.value)}
									className={cx(
										'vx-menu-item',
										'vx-select-option',
										props.selected.includes(option.value) && 'vx-select-option--on',
									)}
									onClick={() => {
										props.onPick(option)
										close()
									}}
								>
									{props.renderOption ? (
										props.renderOption(option)
									) : (
										<span className="vx-menu-item-label">
											{option.label ?? option.value}
											{option.description ? (
												<span className="vx-select-description">{option.description}</span>
											) : null}
										</span>
									)}
								</div>
							))
						) : (
							<div key={index} role="group" aria-label={group.heading}>
								<div className="vx-select-group">{group.heading}</div>
								{group.options.map((option) => (
									<div
										key={option.value}
										role="option"
										className={cx('vx-menu-item', 'vx-select-option')}
										onClick={() => {
											props.onPick(option)
											close()
										}}
									>
										{props.renderOption ? (
											props.renderOption(option)
										) : (
											<span className="vx-menu-item-label">{option.label ?? option.value}</span>
										)}
									</div>
								))}
							</div>
						),
					)}
				</div>
			</BottomSheet>
		) : null}
	</>
}
