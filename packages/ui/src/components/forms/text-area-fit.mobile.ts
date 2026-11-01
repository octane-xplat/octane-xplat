import { Utils } from '@nativescript/core'
import type { TextAreaProps } from '../../props'
import { styleRecord } from '../../internal/layout/style-merge'

export function fitTextArea(
	view: any,
	props: Pick<TextAreaProps, 'rows' | 'autoGrow' | 'maxRows' | 'style'>,
): () => void {
	if (!view) {
		return () => {}
	}
	const fit = () => {
		const style = styleRecord(props.style)
		if (style?.height != null) {
			view.style.minHeight = style.minHeight
			view.style.maxHeight = style.maxHeight
			return
		}
		const iosLine = view.ios?.font?.lineHeight
		const androidLine = view.android?.getLineHeight?.()
		const line =
			iosLine > 0
				? iosLine
				: androidLine > 0
					? Utils.layout.toDeviceIndependentPixels(androidLine)
					: 24
		const rows = props.rows ?? (props.autoGrow ? 1 : 3)
		view.style.minHeight = style?.minHeight ?? rows * line
		view.style.maxHeight =
			style?.maxHeight ??
			(props.maxRows ? props.maxRows * line : props.autoGrow ? undefined : rows * line)
	}
	fit()
	view.on?.('loaded', fit)
	return () => view.off?.('loaded', fit)
}
