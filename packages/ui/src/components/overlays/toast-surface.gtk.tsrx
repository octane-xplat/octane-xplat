/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { ToastEntry, ToastPosition, ToastViewportProps } from '../../props'
import { dismissToast, toastOnViewport, toastStore } from './toast-store'
import { useStore } from '../../data/use-store.tsrx'
import { useThemeScheme } from '../../theme/theme-scheme'
import { themeSchemeClasses } from '../../theme/theme-host'
import { Toast } from './Toast'
import { Popover } from './Popover'
import { createPortal } from '../../internal/platform/native-portal'
import { cx } from '@octane-xplat/lib'

/** Edge gap + inter-toast gap in dips (same values as the native leaf). */
const EDGE_GAP = 16
const STACK_GAP = 8
/** Stack width in dips — the macOS toast presentation's fixed column. */
const STACK_WIDTH = 360

export const TOAST_POSITIONS: ToastPosition[] = ['topStart', 'topEnd', 'bottomStart', 'bottomEnd']

/** Overlay-layer alignment for each toast edge — the scrim-free layer hugs
 *  its corner so the stack only claims the pixels it renders. */
export const TOAST_EDGE_ALIGN: Record<
	ToastPosition,
	{ h: 'start' | 'end'; v: 'start' | 'end' }
> = {
	topStart: { h: 'start', v: 'start' },
	topEnd: { h: 'end', v: 'start' },
	bottomStart: { h: 'start', v: 'end' },
	bottomEnd: { h: 'end', v: 'end' },
}

/** Margin that docks the stack inside its corner layer — the shared edge
 *  gap plus the viewport's optional `inset`. */
const edgeStyle = (position: ToastPosition, inset: ToastViewportProps['inset']) =>
	mergeStyle(
		{ display: 'flex' },
		mergeStyle(
			position.startsWith('top')
				? { marginTop: EDGE_GAP + (inset?.top ?? 0) }
				: { marginBottom: EDGE_GAP + (inset?.bottom ?? 0) },
			position.endsWith('Start')
				? { marginLeft: EDGE_GAP + (inset?.start ?? 0) }
				: { marginRight: EDGE_GAP + (inset?.end ?? 0) },
		),
	)

function ToastCard(props: { entry: ToastEntry }) @{
	<Toast
		{...props.entry.options}
		isExiting={props.entry.exiting}
		onDismiss={(reason: 'auto' | 'manual') => dismissToast(props.entry.id, reason)}
	/>
}

/** One edge column, newest entry sitting at the screen edge — top stacks
 *  reverse the queue, bottom stacks keep it. */
function ToastEdgeStack(props: { entries: ToastEntry[]; position: ToastPosition }) @{
	const top = props.position.startsWith('top')
	const ordered = top ? [...props.entries].reverse() : props.entries
	const end = props.position.endsWith('End')

	<masonview
		className={cx('vx-toast-stack', themeSchemeClasses())}
		style={mergeStyle(
			{ flexDirection: 'column', width: STACK_WIDTH },
			mergeStyle({ display: 'flex', alignItems: end ? 'flex-end' : 'flex-start' }),
		)}
	>
		{ordered.map((entry, index) => (
			<masonview
				key={entry.id}
				style={mergeStyle(
					{ display: 'flex', width: STACK_WIDTH },
					index === 0 ? {} : { marginTop: STACK_GAP },
				)}
			>
				<ToastCard entry={entry} />
			</masonview>
		))}
	</masonview>
}

/** The toast queue presented on corner-docked, nonmodal overlay layers —
 *  one layer per edge so empty window regions never claim input. Mounted
 *  through portals from the declaring `ToastViewport` or through a service
 *  root for the fallback stack (`showToast` outside a viewport). `layers`
 *  maps each position to its `createOverlayLayer` handle; `position`/
 *  `maxVisible`/`inset` mirror `ToastViewportProps`. */
export function GtkToastSurface(props: {
	viewportId: string
	position?: ToastPosition
	maxVisible?: number
	inset?: ToastViewportProps['inset']
	layers: Partial<Record<ToastPosition, any>>
}) @{
	const entries = useStore(toastStore)
	const scheme = useThemeScheme()
	const mine = entries.filter((entry) => toastOnViewport(entry, props.viewportId))
	const max = Math.max(1, props.maxVisible ?? 5)

	const edgeEntries = mine.filter((entry) => !entry.options.anchor)
	const anchored = mine.filter((entry) => entry.options.anchor != null)
	// The visible window per edge bucket is the last `maxVisible` entries —
	// older entries stay queued in the store and resurface as the stack
	// drains, the same contract as the native and web leaves (their
	// auto-hide timers only arm once they mount).
	const edgeFor = (position: ToastPosition): ToastEntry[] =>
		edgeEntries
			.filter((entry) => (entry.options.position ?? props.position ?? 'bottomEnd') === position)
			.slice(-max)

	// The scheme subscription re-renders the surface so a system-scheme flip
	// restamps the theme classes on the separately mounted stacks.
	void scheme

	<>
		{TOAST_POSITIONS.map((position) => {
			const list = edgeFor(position)
			const layer = props.layers[position]
			if (!list.length || !layer) {
				return null
			}

			return createPortal(
				<masonview className="vx-toast-edge" style={edgeStyle(position, props.inset)}>
					<ToastEdgeStack entries={list} position={position} />
				</masonview>,
				layer.target,
			)
		})}
		{anchored.map((entry) => (
			<Popover
				key={entry.id}
				open={!entry.exiting}
				anchor={entry.options.anchor!}
				placement={
					entry.options.placement ??
					((entry.options.position ?? props.position ?? 'bottomEnd').startsWith('top')
						? 'top'
						: 'bottom')
				}
				dismissOnOutsideTap={false}
				onDismiss={() => dismissToast(entry.id, 'manual')}
			>
				<ToastCard entry={entry} />
			</Popover>
		))}
	</>
}
