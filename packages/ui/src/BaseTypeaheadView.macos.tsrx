/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useContext } from 'octane'
import type { SearchableItem } from './props'
import type { BaseTypeaheadViewProps } from './typeahead-view'
import { cx } from '@octane-xplat/lib'
import { Popover } from './surfaces.macos.tsrx'
import { TypeaheadItem } from './TypeaheadItem.macos.tsrx'
import { ActivityIndicator } from './controls.macos.tsrx'
import { BusyLaneContext } from './busy-lane'
import { groupTypeaheadItems } from './typeahead-source'

/** BaseTypeahead presentation — resolved combobox state in, user intents
 *  out. AppKit leaf — the renderer's textfield exposes only `value` +
 *  `onTextChange`, so there is no focus, key navigation, or return-to-select;
 *  options are tap-selected. Internal only — consumers use `BaseTypeahead`. */
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

	<masonview
		className={cx('vx-typeahead', props.className)}
		style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.style))}
	>
		<textfield
			ref={(v: any) => {
				props.inputRef.current = v
			}}
			id={props.inputId}
			className={cx(
				'vx-typeahead-input',
				`vx-typeahead-input--size-${props.size}`,
				props.isDisabled && 'vx-typeahead-input--disabled',
				props.inputClassName,
			)}
			style={props.inputStyle}
			value={props.query}
			placeholder={props.placeholder}
			accessibilityLabel={
				props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
			}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={{ disabled: props.isDisabled }}
			onTextChange={(value: any) => props.onQueryChange(String(value ?? ''))}
		/>
		{props.isSearching && busyLane == null ? (
			<masonview className="vx-typeahead-loading" style={{ display: 'flex' }}>
				<ActivityIndicator busy={true} />
			</masonview>
		) : null}
		<Popover
			anchor={props.anchor}
			open={props.open}
			className="vx-typeahead-dropdown"
			style={{ width: props.menuWidth }}
		>
			<masonview
				className="vx-typeahead-list"
				style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
			>
				{props.results.length === 0 && props.hasSearched ? (
					<masonview className="vx-typeahead-empty" style={{ display: 'flex' }}>
						<label text={props.emptyText} />
					</masonview>
				) : null}
				@for (const group of groups; key group.heading ?? 'ungrouped') {
					{
						group.heading != null ? (
							<label className="vx-typeahead-group" text={group.heading} />
						) : null
					}

					@for (const item of group.items; index gi; key item.id + '-' + gi) {
						const index = props.results.indexOf(item)
						const isSelected = item.id === selectedId && selectedId != null
						<masonview
							className={cx(
								'vx-typeahead-option',
								`vx-typeahead-option--size-${props.size}`,
								index === activeIndex && 'vx-typeahead-option--highlighted',
								isSelected && 'vx-typeahead-option--selected',
							)}
							onTap={() => props.onSelect(item)}
							accessibilityState={{ selected: isSelected }}
							style={mergeStyle(
								{ flexDirection: 'row', alignItems: 'center' },
								{ display: 'flex' },
							)}
						>
							<masonview
								className="vx-typeahead-option-content"
								style={mergeStyle({ flexGrow: 1 }, { display: 'flex' })}
							>
								{props.renderItem ? props.renderItem(item) : <TypeaheadItem item={item} />}
							</masonview>
							{isSelected ? <label className="vx-typeahead-option-check" text="✓" /> : null}
						</masonview>
					}
				}
			</masonview>
		</Popover>
	</masonview>
}
