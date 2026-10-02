import { useEffect, useId, useRef, useState } from 'octane'
import type { SelectProps } from './props'
import { Popover } from './Popover.web.tsrx'
import { useFieldControlProps } from './field-context'
import { useIndicator, CheckIndicator, CheckboxIndicator } from './indicators'
import { useSelect } from './useSelect'
import { cx } from './cx'

/** Finite-list selection. Async entity search belongs to Typeahead. */
export function Select(inputProps: SelectProps) @{
	const props = useFieldControlProps(inputProps)
	const state = useSelect(props)
	const anchor = useRef<HTMLDivElement | null>(null)
	const search = useRef<HTMLInputElement | null>(null)
	const generatedId = useId()
	const listId = `${generatedId}-list`
	const [highlight, setHighlight] = useState<string | null>(null)
	const match = useRef({ text: '', at: 0 })
	const focusSearch = useRef(true)
	const CheckInd = useIndicator('check') ?? CheckIndicator
	const MultiInd = useIndicator('checkbox') ?? CheckboxIndicator
	const active = state.enabled.find((option) => option.value === highlight)
		?? state.enabled.find((option) => state.selected.includes(option.value))
		?? state.enabled[0]

	const optionId = (value: string) => `${listId}-${props.options.findIndex((option) => option.value === value)}`
	const close = (restore = true) => {
		state.setOpen(false)
		setHighlight(null)
		match.current.text = ''
		if (restore) anchor.current?.focus({ preventScroll: true })
	}

	useEffect(() => {
		if (!state.open) { focusSearch.current = true; match.current.text = '' }
	}, [state.open])

	useEffect(() => {
		if (state.open && active) document.getElementById(optionId(active.value))?.scrollIntoView?.({ block: 'nearest' })
	}, [state.open, active?.value])

	const onKey = (event: KeyboardEvent, editing = false) => {
		if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || state.blocked) return
		if (state.open && props.multiple && props.hasSelectAll && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') { event.preventDefault(); state.selectAll(); return }
		const index = state.enabled.findIndex((option) => option.value === active?.value)
		const move = (next: number) => {
			event.preventDefault()
			if (!state.open) state.setOpen(true)
			setHighlight(state.enabled[Math.max(0, Math.min(next, state.enabled.length - 1))]?.value ?? null)
		}

		switch (event.key) {
			case 'ArrowDown': move(state.open ? index + 1 : Math.max(index, 0)); return
			case 'ArrowUp': move(state.open ? index - 1 : state.enabled.length - 1); return
			case 'Home': if (!editing && state.open) move(0); return
			case 'End': if (!editing && state.open) move(state.enabled.length - 1); return
			case 'PageUp': if (state.open) move(0); return
			case 'PageDown': if (state.open) move(state.enabled.length - 1); return
			case 'Enter':
			case ' ':
				if (event.key === ' ' && editing) return
				event.preventDefault()
				if (!state.open) state.setOpen(true)
				else if (active && !state.pending) {
					state.pick(active)
					if (!props.multiple) anchor.current?.focus({ preventScroll: true })
				}

				return
			case 'Escape':
				if (state.open) { event.preventDefault(); event.stopPropagation(); close() }
				return
			case 'Tab':
				if (state.open) {
					if (event.target === search.current && state.query && !event.shiftKey) return
					close()
					if (editing && event.shiftKey) event.preventDefault()
				}

				return
			case 'Backspace':
			case 'Delete':
				if (!editing && !state.open && props.hasClear) { event.preventDefault(); state.clear() }
				return
		}

		if (editing || event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return
		event.preventDefault()
		if (props.searchable) {
			state.setQuery(event.key)
			state.setOpen(true)
			return
		}

		const now = Date.now()
		const previous = now - match.current.at < 500 ? match.current.text : ''
		const text = previous + event.key.toLowerCase()
		match.current = { text, at: now }
		const repeated = [...text].every((char) => char === text[0])
		const prefix = repeated ? text[0] : text
		const start = repeated ? index + 1 : 0
		const ordered = [...state.enabled.slice(start), ...state.enabled.slice(0, start)]
		const option = ordered.find((item) => (item.label ?? item.value).toLowerCase().startsWith(prefix))
		if (option) {
			setHighlight(option.value)
			if (!state.open && !props.multiple) state.pick(option)
			else state.setOpen(true)
		}
	}

	<>
		<div
			ref={(element: any) => { anchor.current = element }}
			id={props.id}
			role={!props.searchable || props.isReadOnly ? 'combobox' : 'button'}
			tabIndex={props.isDisabled && !props.disabledMessage ? -1 : 0}
			className={cx('vx-select-trigger', props.isDisabled && 'vx-select--disabled', props.isReadOnly && 'vx-select--readonly', state.busy && 'vx-select--loading', props.status && `vx-select--status-${props.status.type}`, props.size && `vx-select--size-${props.size}`, props.className)}
			style={props.style}
			aria-label={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
			aria-labelledby={props.ariaLabelledBy}
			aria-describedby={props.ariaDescribedBy}
			aria-description={props.accessibilityHint}
			aria-disabled={props.isDisabled || undefined}
			aria-readonly={props.isReadOnly || undefined}
			aria-busy={state.busy || undefined}
			aria-required={props.isRequired && !props.isOptional || undefined}
			aria-invalid={props.status?.type === 'error' || undefined}
			aria-haspopup="listbox"
			aria-expanded={state.open}
			aria-controls={state.open ? listId : undefined}
			aria-activedescendant={state.open && !props.searchable && active ? optionId(active.value) : undefined}
			title={props.isDisabled ? props.disabledMessage : undefined}
			onClick={() => state.open ? close() : state.setOpen(true)}
			onKeyDown={(event: KeyboardEvent) => { if (event.target === event.currentTarget) onKey(event) }}
		>
			<span className={cx('vx-select-value', !state.selected.length && 'vx-select-placeholder')}>{state.triggerText}</span>
			{props.hasClear && state.selected.length && !state.blocked ? <button type="button" className="vx-select-clear" aria-label="Clear selection" disabled={state.pending} onClick={(event: MouseEvent) => { event.stopPropagation(); state.clear(); anchor.current?.focus() }}>×</button> : null}
			{state.busy ? <span className="vx-select-loading" role="status">Loading…</span> : null}
			{!props.isReadOnly ? <span className="vx-select-caret" aria-hidden="true">▾</span> : null}
		</div>
		{props.htmlName ? state.selected.map((value) => <input key={value} type="hidden" name={props.htmlName} value={value} disabled={props.isDisabled} />) : null}
		<span className="vx-sr-only" role="status" aria-live="polite">{state.announcement}</span>
		<Popover anchor={anchor} open={state.open} placement={props.placement ?? 'bottom'} onDismiss={() => close()} className="vx-menu">
			{props.searchable ? <div className="vx-select-search-row">
				<input
					ref={(element: any) => {
						search.current = element
						if (element && focusSearch.current) { focusSearch.current = false; element.focus() }
					}}
					id={props.id ? `${props.id}-search` : undefined}
					className="vx-input vx-select-search"
					role="combobox"
					aria-label="Search options"
					aria-expanded={state.open}
					aria-controls={listId}
					aria-autocomplete="list"
					aria-activedescendant={active ? optionId(active.value) : undefined}
					placeholder={props.searchPlaceholder ?? 'Search…'}
					value={state.query}
					onInput={(event: any) => { setHighlight(null); state.setQuery(event.target.value) }}
					onKeyDown={(event: KeyboardEvent) => onKey(event, true)}
				/>
				{state.query ? <button type="button" className="vx-select-search-clear" aria-label="Clear search" onClick={() => { state.setQuery(''); search.current?.focus() }} onKeyDown={(event: KeyboardEvent) => onKey(event, true)}>×</button> : null}
			</div> : null}
			{props.multiple && props.hasSelectAll ? <button type="button" id={props.id ? `${props.id}-select-all` : undefined} className="vx-select-all" disabled={state.pending || !state.enabled.length} aria-label={props.selectAllLabel ?? 'Select all'} aria-pressed={state.selectAllState === 'indeterminate' ? 'mixed' : state.selectAllState === 'checked'} onClick={state.selectAll}><MultiInd state={state.selectAllState} /><span>{props.selectAllLabel ?? 'Select all'}</span></button> : null}
			<div id={listId} role="listbox" aria-label={props.label ?? props.accessibilityLabel ?? 'Options'} aria-multiselectable={props.multiple || undefined} aria-busy={state.busy || undefined} className="vx-menu-list vx-select-list" style={{ maxHeight: props.maxMenuHeight ?? 280 }}>
				{!state.shown.length && !state.busy ? <div role="presentation" className="vx-select-empty">{state.emptyText}</div> : null}
				{state.groups.map((group, index) => {
					const rows = group.options.map((option) => <div
						key={option.value} id={optionId(option.value)} role="option"
						aria-selected={state.selected.includes(option.value)} aria-disabled={option.isDisabled || state.pending || undefined}
						className={cx('vx-menu-item', 'vx-select-option', state.selected.includes(option.value) && 'vx-select-option--on', active?.value === option.value && 'vx-select-option--highlighted', option.isDisabled && 'vx-menu-item--disabled')}
						onMouseDown={(event: MouseEvent) => event.preventDefault()}
						onMouseEnter={() => { if (!option.isDisabled) setHighlight(option.value) }}
						onClick={() => { state.pick(option); if (!props.multiple && !option.isDisabled) anchor.current?.focus() }}
					><span className="vx-select-check" aria-hidden="true">{props.multiple ? <MultiInd state={state.selected.includes(option.value) ? 'checked' : 'unchecked'} isDisabled={option.isDisabled} /> : <CheckInd state={state.selected.includes(option.value) ? 'checked' : 'unchecked'} isDisabled={option.isDisabled} />}</span><span className="vx-menu-item-label">{option.label ?? option.value}{option.description ? <span className="vx-select-description">{option.description}</span> : null}</span></div>)

					return group.heading == null ? rows : <div key={index} role="group" aria-label={group.heading}><div className="vx-select-group" aria-hidden="true">{group.heading}</div>{rows}</div>
				})}
			</div>
		</Popover>
	</>
}
