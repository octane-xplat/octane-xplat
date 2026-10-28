import { useContext, useEffect } from 'octane'
import { styleRecord } from './style-merge'
import type { SearchableItem } from './props'
import type { BaseTypeaheadViewProps } from './typeahead-view'
import { applyEscapeProps } from './escape-props'
import { Popover } from './Popover.web.tsrx'
import { TypeaheadItem } from './TypeaheadItem.web.tsrx'
import { ActivityIndicator } from './ActivityIndicator.web.tsrx'
import { BusyLaneContext } from './busy-lane'
import { groupTypeaheadItems } from './typeahead-source'

function isImeKeyEvent(e: any): boolean {
	return e?.isComposing === true || e?.keyCode === 229
}

/** BaseTypeahead presentation — resolved combobox state in, user intents
 *  out. Owns the input element, keyboard navigation with IME guards,
 *  pointer highlight, and the listbox accessibility wiring; internal only —
 *  consumers use `BaseTypeahead`. */
export function BaseTypeaheadView<T extends SearchableItem>(
	props: BaseTypeaheadViewProps<T>,
) @{
	const busyLane = useContext(BusyLaneContext)
	const groups = groupTypeaheadItems(props.results, { ungroupedFirst: true })
	const selectedId = props.value?.id
	const activeIndex =
		props.highlightedIndex >= 0 && props.highlightedIndex < props.results.length
			? props.highlightedIndex
			: -1

	const itemId = (index: number) => `${props.listboxId}-option-${index}`

	// Keep the keyboard highlight scrolled into view (hover never scrolls).
	useEffect(() => {
		if (!props.open || activeIndex < 0) {
			return
		}

		document.getElementById(itemId(activeIndex))?.scrollIntoView?.({ block: 'nearest' })
	}, [activeIndex, props.open])

	const handleKeyDown = (e: any) => {
		props.onKeyDown?.(e)
		if (e.defaultPrevented) {
			return
		}

		// An IME candidate window owns Enter/Escape/arrows mid-composition.
		if (isImeKeyEvent(e)) {
			return
		}

		if (!props.open) {
			if (e.key === 'ArrowDown' && (props.hasEntriesOnFocus || props.query.length > 0)) {
				e.preventDefault()
				props.onOpenChange(true)
			}

			return
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault()
				if (props.results.length > 0) {
					props.onHighlight?.(activeIndex < props.results.length - 1 ? activeIndex + 1 : 0)
				}

				break
			case 'ArrowUp':
				e.preventDefault()
				if (props.results.length > 0) {
					props.onHighlight?.(activeIndex > 0 ? activeIndex - 1 : props.results.length - 1)
				}

				break
			case 'Enter':
				e.preventDefault()
				if (activeIndex >= 0) {
					props.onSelect(props.results[activeIndex])
				}

				break
			case 'Escape':
				e.preventDefault()
				props.onOpenChange(false)
				break
			case 'Tab':
				props.onOpenChange(false)
				break
			case 'Home':
				e.preventDefault()
				if (props.results.length > 0) {
					props.onHighlight?.(0)
				}

				break
			case 'End':
				e.preventDefault()
				if (props.results.length > 0) {
					props.onHighlight?.(props.results.length - 1)
				}

				break
		}
	}

	<>
		<input
			ref={(el: any) => {
				props.inputRef.current = el
				if (!el) {
					return
				}

				applyEscapeProps(el, props)
			}}
			id={props.inputId}
			tabIndex={props.inputTabIndex}
			type="text"
			role="combobox"
			className={[
				'vx-typeahead-input',
				`vx-typeahead-input--size-${props.size}`,
				props.isDisabled ? 'vx-typeahead-input--disabled' : undefined,
				props.inputClassName,
				props.className,
			]}
			style={{ ...styleRecord(props.style), ...styleRecord(props.inputStyle) }}
			aria-expanded={props.open}
			aria-controls={props.listboxId}
			aria-activedescendant={props.open && activeIndex >= 0 ? itemId(activeIndex) : undefined}
			aria-autocomplete="list"
			aria-busy={props.isSearching || undefined}
			aria-label={props.ariaLabel}
			aria-labelledby={props.ariaLabelledBy}
			aria-describedby={props.ariaDescribedBy}
			aria-description={props.ariaDescription}
			aria-required={(props.isRequired && !props.isOptional) || undefined}
			aria-invalid={props.status?.type === 'error' || undefined}
			aria-disabled={props.isFocusableDisabled ? 'true' : undefined}
			value={props.query}
			onInput={(e: any) => props.onQueryChange(e.target.value)}
			onFocus={() => props.onInputFocus?.()}
			onBlur={(e: any) => props.onInputBlur?.(e)}
			onKeyDown={handleKeyDown}
			placeholder={props.placeholder}
			disabled={(props.isDisabled && !props.isFocusableDisabled) || undefined}
			readOnly={props.isFocusableDisabled || props.isReadOnly || undefined}
			autoComplete="off"
		/>
		{props.isSearching && busyLane == null ? (
			<span className="vx-typeahead-loading" role="status" aria-label="Loading">
				<ActivityIndicator busy={true} />
			</span>
		) : null}
		<span className="vx-sr-only" role="status">
			{props.announcement}
		</span>
		<Popover
			anchor={props.anchor}
			open={props.open}
			placement={props.placement ?? 'bottom'}
			onDismiss={() => props.onOpenChange(false)}
			className="vx-typeahead-dropdown"
			style={{
				minWidth: props.anchorWidth && props.anchorWidth > 0 ? props.anchorWidth : undefined,
				width: props.menuWidth,
			}}
			web={{ id: props.panelId }}
		>
			<div
				id={props.listboxId}
				role="listbox"
				aria-label="Search results"
				className="vx-typeahead-list"
			>
				{props.results.length === 0 && props.hasSearched ? (
					<div role="option" aria-disabled="true" className="vx-typeahead-empty">
						{props.emptyText}
					</div>
				) : (
					groups.map((group, gi) => {
						const options = group.items.map((item) => {
							const index = props.results.indexOf(item)
							const isSelected = item.id === selectedId && selectedId != null
							return (
								<div
									key={`${item.id}-${index}`}
									id={itemId(index)}
									role="option"
									aria-selected={isSelected || undefined}
									tabIndex={-1}
									className={[
										'vx-typeahead-option',
										`vx-typeahead-option--size-${props.size}`,
										index === activeIndex ? 'vx-typeahead-option--highlighted' : undefined,
										isSelected ? 'vx-typeahead-option--selected' : undefined,
									]}
									onMouseDown={(e: any) => e.preventDefault()}
									onMouseEnter={() => props.onHighlight?.(index)}
									onClick={() => props.onSelect(item)}
								>
									<span className="vx-typeahead-option-content">
										{props.renderItem ? props.renderItem(item) : <TypeaheadItem item={item} />}
									</span>
									{isSelected ? (
										<span className="vx-typeahead-option-check" aria-hidden="true">
											✓
										</span>
									) : null}
								</div>
							)
						})

						if (group.heading == null) {
							return options
						}

						return (
							<div key={`group-${group.heading ?? gi}`} role="group" aria-label={group.heading}>
								<div className="vx-typeahead-group" aria-hidden="true">
									{group.heading}
								</div>
								{options}
							</div>
						)
					})
				)}
			</div>
		</Popover>
	</>
}
