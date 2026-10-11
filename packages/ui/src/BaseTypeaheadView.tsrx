/** @jsxImportSource @nativescript-community/octane */
import { useContext } from 'octane';
import type { SearchableItem } from './props';
import type { BaseTypeaheadViewProps } from './typeahead-view';
import { cx } from '@octane-xplat/lib';
import { applyEscapeProps, nativeAccessibilityState } from './escape-props';
import { isWritingText } from './text-write';
import { Popover } from './Popover';
import { TypeaheadItem } from './TypeaheadItem';
import { ActivityIndicator } from './ActivityIndicator.tsrx';
import { BusyLaneContext } from './busy-lane';
import { groupTypeaheadItems } from './typeahead-source';

/** BaseTypeahead presentation — resolved combobox state in, user intents
 *  out. Native leaf — options are tap-driven (native text fields emit no
 *  arrow/escape key events; the return key selects the highlighted or
 *  first option). Internal only — consumers use `BaseTypeahead`. */
export function BaseTypeaheadView<T extends SearchableItem,>(props: BaseTypeaheadViewProps<T>) @{
	const busyLane = useContext(BusyLaneContext);
	const groups = groupTypeaheadItems(props.results, { ungroupedFirst: true });
	const selectedId = props.value?.id;
	const activeIndex = props.highlightedIndex >= 0 && props.highlightedIndex < props.results.length
		? props.highlightedIndex
		: -1;

	<>
		<textfield
			ref={(v: any) => {
				props.inputRef.current = v;
				if (!v) return;
				applyEscapeProps(v, props);
			}}
			id={props.inputId}
			className={cx('vx-typeahead-input', `vx-typeahead-input--size-${props.size}`, props.isDisabled && 'vx-typeahead-input--disabled', props.inputClassName, props.className)}
			style={{ ...props.style, ...props.inputStyle }}
			hint={props.placeholder}
			accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled }) as any}
			isEnabled={!props.isDisabled || props.isFocusableDisabled}
			editable={!(props.isDisabled || props.isReadOnly)}
			onTextChange={(e: any) => { if (!isWritingText(e.object)) props.onQueryChange(e.value); }}
			onReturnPress={() => {
				const item = activeIndex >= 0 ? props.results[activeIndex] : props.results[0];
				if (item) props.onSelect(item);
			}}
			onFocus={() => props.onInputFocus?.()}
			onBlur={(e: any) => props.onInputBlur?.(e)}
		/>
		{props.isSearching && busyLane == null
			? <flexboxlayout className="vx-typeahead-loading"><ActivityIndicator busy={true} /></flexboxlayout>
			: null}
		<Popover
			anchor={props.anchor}
			open={props.open}
			placement={props.placement ?? 'bottom'}
			onDismiss={() => props.onOpenChange(false)}
			className="vx-typeahead-dropdown"
			style={{ minWidth: props.anchorWidth && props.anchorWidth > 0 ? props.anchorWidth : undefined, width: props.menuWidth }}
		>
			<scrollview className="vx-typeahead-scroll">
				<flexboxlayout className="vx-typeahead-list" flexDirection="column">
					{props.results.length === 0 && props.hasSearched
						? <flexboxlayout className="vx-typeahead-empty"><label text={props.emptyText} /></flexboxlayout>
						: null}
					@for (const group of groups; key group.heading ?? 'ungrouped') {
						{group.heading != null
							? <label className="vx-typeahead-group" text={group.heading} />
							: null}

						@for (const item of group.items; index gi; key item.id + '-' + gi) {
							const index = props.results.indexOf(item);
							const isSelected = item.id === selectedId && selectedId != null;
							<flexboxlayout
								className={cx('vx-typeahead-option', `vx-typeahead-option--size-${props.size}`, index === activeIndex && 'vx-typeahead-option--highlighted', isSelected && 'vx-typeahead-option--selected')}
								flexDirection="row"
								alignItems="center"
								onTap={() => props.onSelect(item)}
								accessibilityState={nativeAccessibilityState({ selected: isSelected }) as any}
							>
								<flexboxlayout className="vx-typeahead-option-content" flexGrow={1}>
									{props.renderItem ? props.renderItem(item) : <TypeaheadItem item={item} />}
								</flexboxlayout>
								{isSelected ? <label className="vx-typeahead-option-check" text="✓" /> : null}
							</flexboxlayout>
						}
					}
				</flexboxlayout>
			</scrollview>
		</Popover>
	</>
}
