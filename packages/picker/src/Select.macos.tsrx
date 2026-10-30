/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import type { SelectProps } from './web/types'

/** Labeled AppKit NSPopUpButton with controlled or initial selection. */
export function Select(props: SelectProps): unknown {
	const controlled = props.value !== undefined
	const [internalValue, setInternalValue] = useState(
		props.defaultValue ?? props.options[0]?.value ?? '',
	)

	// Uncontrolled with a blank internal selection displays the first option
	// once options exist — the default is auto-select-first.
	const value = controlled ? props.value! : internalValue || (props.options[0]?.value ?? '')
	const selectedIndex = props.options.findIndex((option) => option.value === value)
	const host = useRef<any>(null)

	// The renderer owns menu construction and the action lifetime. Disabled and
	// per-item enablement are not listpicker props, so apply them to the view
	// after every commit — including commits that only rebuilt the menu items.
	useEffect(() => {
		const view = host.current
		if (!view) {
			return
		}

		view.enabled = !props.disabled
		view.autoenablesItems = false
		for (let index = 0; index < props.options.length; index++) {
			const item = view.itemAtIndex(index)
			if (item) {
				item.enabled = !props.options[index].disabled
			}
		}

		// An unmatched controlled value keeps no selection instead of clamping.
		if (selectedIndex < 0) {
			view.selectItemAtIndex(-1)
		}
	})

	return (
		<masonview
			className={props.className}
			style={{ display: 'flex', flexDirection: 'column', gap: 4, ...props.style }}
		>
			<label text={props.label} />
			<listpicker
				id={props.id}
				ref={host}
				items={props.options.map((option) => option.label)}
				selectedIndex={selectedIndex}
				accessibilityLabel={props.accessibilityLabel ?? props.label}
				onSelectedIndexChange={(event: any) => {
					// The renderer also notifies when it syncs the committed selection
					// (mount, prop changes, item rebuilds). Only a move away from the
					// committed index after the first sync is a user pick.
					if (event.oldValue === -1 || event.value === selectedIndex) {
						return
					}

					const option = props.options[event.value]
					if (!option || option.disabled) {
						host.current?.selectItemAtIndex(selectedIndex)
						return
					}

					if (!controlled) {
						setInternalValue(option.value)
					}

					props.onChange?.(option.value)
					// A controlled value that stays put must revert the view.
					if (controlled) {
						host.current?.selectItemAtIndex(selectedIndex)
					}
				}}
			/>
		</masonview>
	)
}
