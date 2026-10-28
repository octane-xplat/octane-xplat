/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import type { ToolbarProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'
import { SizeProvider } from './size-context'

const SIZE_MIN: Record<string, number> = { sm: 28, md: 32, lg: 36 }

/** Toolbar — named contextual action region with start / optional center /
 *  end slots. Native leaf: the same slot layout minus keyboard roving
 *  (pointer platforms carry the composite-widget arrow navigation). */
export function Toolbar(props: ToolbarProps) @{
	const size = props.size ?? 'md'
	const gapPx = (props.gap ?? 1) * 4
	const vertical = props.orientation === 'vertical'
	const hasCenter = props.centerContent != null
	const dividerCls = (props.dividers ?? []).map((d) => 'vx-toolbar--div-' + d).join(' ')

	<SizeProvider value={size}>
		<masonview
			id={props.id}
			ref={(v: any) => applyEscapeProps(v, props)}
			className={cx(
				'vx-toolbar',
				'vx-toolbar--' + (props.variant ?? 'transparent'),
				'vx-toolbar--' + size,
				dividerCls,
				props.className,
			)}
			style={mergeStyle({ display: 'flex' }, props.style)}
			accessibilityLabel={props.label}
		>
			@if (hasCenter && !vertical) {
				<masonview
					className="vx-toolbar-inner"
					style={mergeStyle(
						{ display: 'grid', gridTemplateColumns: '1fr auto 1fr' },
						{ minHeight: SIZE_MIN[size] },
					)}
				>
					<masonview
						style={mergeStyle(
							{ alignItems: 'center', gap: gapPx },
							mergeStyle({ display: 'flex' }, { gridColumn: '1' }),
						)}
						className="vx-toolbar-slot vx-toolbar-slot--start"
					>
						{props.startContent}
					</masonview>
					<masonview
						style={mergeStyle(
							{ alignItems: 'center', justifyContent: 'center', gap: gapPx },
							mergeStyle({ display: 'flex' }, { gridColumn: '2' }),
						)}
						className="vx-toolbar-slot vx-toolbar-slot--center"
					>
						{props.centerContent}
					</masonview>
					<masonview
						style={mergeStyle(
							{ alignItems: 'center', justifyContent: 'flex-end', gap: gapPx },
							mergeStyle({ display: 'flex' }, { gridColumn: '3' }),
						)}
						className="vx-toolbar-slot vx-toolbar-slot--end"
					>
						{props.endContent}
					</masonview>
				</masonview>
			} @else {
				<masonview
					className="vx-toolbar-inner"
					style={mergeStyle(
						{
							flexDirection: vertical ? 'column' : 'row',
							alignItems: vertical ? 'stretch' : 'center',
							justifyContent: vertical || hasCenter ? 'flex-start' : 'space-between',
							gap: gapPx,
						},
						mergeStyle(
							{ display: 'flex' },
							{ minHeight: vertical ? undefined : SIZE_MIN[size] },
						),
					)}
				>
					@if (props.startContent != null) {
						<masonview
							className="vx-toolbar-slot vx-toolbar-slot--start"
							style={mergeStyle(
								{
									flexDirection: vertical ? 'column' : 'row',
									alignItems: 'center',
									gap: gapPx,
									flexGrow: props.endContent == null ? 1 : 0,
								},
								{ display: 'flex' },
							)}
						>
							{props.startContent}
						</masonview>
					}
					@if (props.centerContent != null) {
						<masonview
							className="vx-toolbar-slot vx-toolbar-slot--center"
							style={mergeStyle(
								{
									flexDirection: vertical ? 'column' : 'row',
									alignItems: 'center',
									justifyContent: 'center',
									gap: gapPx,
									flexGrow: 1,
								},
								{ display: 'flex' },
							)}
						>
							{props.centerContent}
						</masonview>
					}
					@if (props.endContent != null) {
						<masonview
							className="vx-toolbar-slot vx-toolbar-slot--end"
							style={mergeStyle(
								{
									flexDirection: vertical ? 'column' : 'row',
									alignItems: 'center',
									justifyContent: vertical ? 'center' : 'flex-end',
									gap: gapPx,
								},
								{ display: 'flex' },
							)}
						>
							{props.endContent}
						</masonview>
					}
				</masonview>
			}
		</masonview>
	</SizeProvider>
}
