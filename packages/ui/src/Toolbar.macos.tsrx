/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import type { ToolbarProps } from './props'
import { cx } from '@octane-xplat/lib'
import { useLayoutEffect, useMemo, useRef } from 'octane'
import { createAppKitToolbarFocus } from './toolbar-focus.macos'
import { useKeyboard } from './use-keyboard.macos'
import { SizeProvider } from './size-context'

const SIZE_MIN: Record<string, number> = { sm: 28, md: 32, lg: 36 }

/** Named action region with stable slots and manual AppKit action focus. */
export function Toolbar(props: ToolbarProps) @{
	const size = props.size ?? 'md'
	const gapPx = (props.gap ?? 1) * 4
	const vertical = props.orientation === 'vertical'
	const hasCenter = props.centerContent != null
	const grid = hasCenter && !vertical
	const dividerCls = (props.dividers ?? []).map((d) => 'vx-toolbar--div-' + d).join(' ')
	const live = useRef(props); live.current = props
	const focus = useMemo(() => createAppKitToolbarFocus({ orientation: () => live.current.orientation ?? 'horizontal' }), [])
	const { keyboardProps } = useKeyboard({ onKeyDown: focus.keyDown })
	useLayoutEffect(() => { focus.update() }, [props])
	useLayoutEffect(() => () => focus.dispose(), [])

	<SizeProvider value={size}>
		<masonview id={props.id} ref={focus.bind} {...keyboardProps}
			className={cx('vx-toolbar', 'vx-toolbar--' + (props.variant ?? 'transparent'),
				'vx-toolbar--' + size, dividerCls, props.className)}
			style={mergeStyle({ display: 'flex' }, props.style)}
			accessibilityRole="toolbar" accessibilityLabel={props.label}>
			<masonview className="vx-toolbar-inner" style={{
				display: grid ? 'grid' : 'flex', gridTemplateColumns: grid ? '1fr auto 1fr' : undefined,
				flexDirection: vertical ? 'column' : 'row', alignItems: vertical ? 'stretch' : 'center',
				justifyContent: vertical || hasCenter ? 'flex-start' : 'space-between', gap: gapPx,
				minHeight: vertical ? undefined : SIZE_MIN[size],
			}}>
				@if (props.startContent != null) {
					<masonview className="vx-toolbar-slot vx-toolbar-slot--start" style={{
						display: 'flex', gridColumn: grid ? '1' : undefined, flexDirection: vertical ? 'column' : 'row',
						alignItems: 'center', gap: gapPx, flexGrow: !grid && props.endContent == null ? 1 : 0,
					}}>{props.startContent}</masonview>
				}
				@if (props.centerContent != null) {
					<masonview className="vx-toolbar-slot vx-toolbar-slot--center" style={{
						display: 'flex', gridColumn: grid ? '2' : undefined, flexDirection: vertical ? 'column' : 'row',
						alignItems: 'center', justifyContent: 'center', gap: gapPx, flexGrow: grid ? 0 : 1,
					}}>{props.centerContent}</masonview>
				}
				@if (props.endContent != null) {
					<masonview className="vx-toolbar-slot vx-toolbar-slot--end" style={{
						display: 'flex', gridColumn: grid ? '3' : undefined, flexDirection: vertical ? 'column' : 'row',
						alignItems: 'center', justifyContent: vertical ? 'center' : 'flex-end', gap: gapPx,
					}}>{props.endContent}</masonview>
				}
			</masonview>
		</masonview>
	</SizeProvider>
}
