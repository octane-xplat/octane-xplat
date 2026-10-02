/** @jsxImportSource @octane-xplat/macos-renderer */
import { useEffect, useRef } from 'octane'
import type { AppKitDatePickerProps } from './macos/types'

const host = (): any => (globalThis as any).__xplatAppKit ?? {}

/** Embeds a real NSDatePicker in the leaf's backing view via the
 *  `__xplatAppKit` bridge. 'date' uses a text field (or the inline
 *  graphical calendar when `pickerStyle` is 'graphical'); 'time' uses the
 *  clock-and-calendar field; 'dateAndTime' shows both element groups.
 *  The host element carries an explicit size — the picker is pinned to
 *  its edges. */
export function AppKitDatePicker(props: AppKitDatePickerProps) @{
	const anchor = useRef<any>(null)
	const handle = useRef<any>(null)

	const options = () => ({
		mode: props.components === 'time' ? 'time' : 'date',
		style: props.pickerStyle,
		selectionMillis: (props.selection ?? props.defaultSelection)?.getTime?.(),
		minimumMillis: props.minimumDate?.getTime?.(),
		maximumMillis: props.maximumDate?.getTime?.(),
		enabled: !props.disabled,
	})

	useEffect(() => {
		const view = anchor.current
		const attach = host().attachDatePicker
		if (!view || typeof attach !== 'function') return
		handle.current = attach(view, options(), (millis: number) => {
			props.onSelectionChange?.(new Date(millis))
		})

		return () => {
			handle.current?.detach()
			handle.current = null
		}
	}, [props.components, props.pickerStyle])

	// Push controlled selection/range updates into the mounted picker; the
	// bridge update is echo-suppressed by comparing against dateValue.
	useEffect(() => {
		handle.current?.update(options())
	})

	<flexboxlayout
		ref={(v: any) => { anchor.current = v }}
		id={props.id}
		className={props.className}
		style={{
			minWidth: 240,
			minHeight: props.pickerStyle === 'graphical' ? 300 : 26,
			...props.style,
		}}
	/>;
}
