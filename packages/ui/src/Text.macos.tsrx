/** @jsxImportSource @octane-xplat/jsx */
import { useContext } from 'octane'
import { AppKitTextContext, AppKitTextScope } from './text-context.macos.tsrx'
import { layoutChildProps } from './layout-child'
import type { RichTextProps, RichTextSpanProps, TextProps } from './props'
import { mergeStyle } from './style-merge'
import { cx } from '@octane-xplat/lib'
import { useTheme } from './theme/use-theme'
import { textScaleStyle } from './text-scale'

export function Text(props: TextProps) @{
	const inText = useContext(AppKitTextContext)
	const theme = useTheme()
	const scale = textScaleStyle(theme.tokens, props)
	const maxLines = props.maxLines ?? 0
	const textStyle = mergeStyle({
		...(scale.fontSizePx != null && { fontSize: scale.fontSizePx }),
		...(scale.fontWeight && { fontWeight: scale.fontWeight }),
		...(scale.lineHeightPx != null && { lineHeight: scale.lineHeightPx }),
		...(scale.fontFamily && { fontFamily: scale.fontFamily }),
		...(scale.color && { color: scale.color }),
		...(maxLines > 0 ? { flexShrink: 1 } : {}),
	}, props.style)

	@if (inText) {
		<span className={cx(props.className)} style={textStyle}>
			{props.children}
		</span>
	} @else {
		<label
			id={props.id}
			testID={props.testID}
			className={cx(
				'vx-text',
				props.type && `vx-text--${props.type}`,
				props.size && `vx-text--size-${props.size}`,
				props.color && `vx-text--color-${props.color}`,
				props.className,
			)}
			{...layoutChildProps(props, textStyle)}
			maxLines={maxLines > 0 ? maxLines : undefined}
			whiteSpace={maxLines === 1 ? 'nowrap' : undefined}
			textOverflow={maxLines > 0 ? 'ellipsis' : undefined}
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={props.accessibilityRole}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
		>
			<AppKitTextScope>{props.children}</AppKitTextScope>
		</label>
	}
}

export function RichText(props: RichTextProps) @{
	const inText = useContext(AppKitTextContext)
	@if (inText) {
		<span className={cx('vx-rich-text', props.className)} style={props.style}>
			{props.children}
		</span>
	} @else {
		<label id={props.id} className={cx('vx-rich-text', props.className)}
			{...layoutChildProps(props, props.style)} accessibilityLabel={props.accessibilityLabel}>
			<AppKitTextScope>{props.children}</AppKitTextScope>
		</label>
	}
}

export function RichTextSpan(props: RichTextSpanProps) @{
	// Per-run onPress still needs a native glyph hit-testing path.
	<span text={props.text} className={cx(props.className)} style={props.style}>
		{props.text != null ? null : props.children}
	</span>
}
