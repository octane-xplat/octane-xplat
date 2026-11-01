/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import {
	Button,
	Text,
	Toast,
	ToastViewport,
	View,
	showToast,
	useToast,
} from '@octane-xplat/ui'
import type { ToastHandle } from '@octane-xplat/ui'

/** Buttons docked on the enclosing viewport — `useToast` reads the context. */
function ViewportProbes(props: {
	prefix: string
	keep: (key: string, handle: ToastHandle | null) => void
}) @{
	const toast = useToast()
	<>
		<Button
			id={`${props.prefix}-push`}
			label={`${props.prefix} push`}
			clickAction={() =>
				props.keep(
					`${props.prefix}a`,
					toast({ body: `${props.prefix}-toast-a`, isAutoHide: false }),
				)
			}
		/>
		<Button
			id={`${props.prefix}-push-b`}
			label={`${props.prefix} push b`}
			clickAction={() =>
				props.keep(
					`${props.prefix}b`,
					toast({ body: `${props.prefix}-toast-b`, isAutoHide: false }),
				)
			}
		/>
		<Button
			id={`${props.prefix}-push-c`}
			label={`${props.prefix} push c`}
			clickAction={() =>
				props.keep(
					`${props.prefix}c`,
					toast({ body: `${props.prefix}-toast-c`, isAutoHide: false }),
				)
			}
		/>
	</>
}

/** renderContent lives in the .tsrx — the driver calls this to push a
 *  toast carrying a real dismiss button inside its custom layout. */
export const pushRenderToast = (onHide: (reason: string) => void) =>
	showToast({
		isAutoHide: false,
		onHide,
		renderContent: (t) => (
			<View style={{ flexDirection: 'row', alignItems: 'center' }}>
				<Text>render-toast-body</Text>
				<Button id="toast-dismiss-btn" label="Close" clickAction={() => t.dismiss()} />
			</View>
		),
	})

export function ToastProbe() @{
	const [mark, setMark] = useState('none')
	const [bgClicks, setBgClicks] = useState(0)
	const [vp2Mounted, setVp2Mounted] = useState(true)
	const anchorRef = useRef<any>(null)
	const handles = useRef<Record<string, ToastHandle | null>>({})
	const outerToast = useToast() // no viewport context — lands on the fallback stack
	const keep = (key: string, handle: ToastHandle | null) => {
		handles.current[key] = handle
	}

	// Every interactive probe lives in a narrow left column — live toast
	// stacks own the corners (360-wide columns at both edges), so buttons
	// stay in the uncovered middle-left band.
	<View style={{ flexDirection: 'column', width: 150, marginTop: 90 }}>
		<Button id="bg" label="Background" clickAction={() => setBgClicks(bgClicks + 1)} />
		<Text id="bg-count">{String(bgClicks)}</Text>
		<Button ref={anchorRef} id="anchor-btn" label="Anchor" clickAction={() => setMark('anchor')} />
		<Button
			id="t-outer"
			label="Outer"
			clickAction={() => {
				outerToast({
					body: 'outer-toast-body',
					isAutoHide: false,
					onHide: (r) => setMark('hide:outer:' + r),
				})
			}}
		/>
		<ToastViewport position="topEnd" maxVisible={2}>
			<ViewportProbes prefix="vp" keep={keep} />
		</ToastViewport>
		<Button
			id="t-anchor"
			label="Anchored"
			clickAction={() => {
				outerToast({
					body: 'anchored-toast-body',
					anchor: anchorRef,
					isAutoHide: false,
					onHide: (r) => setMark('hide:anchor:' + r),
				})
			}}
		/>
		<Button id="vp-dismiss-c" label="Dismiss C" clickAction={() => handles.current.vpc?.dismiss()} />
		{vp2Mounted ? (
			<ToastViewport position="bottomStart" inset={{ bottom: 60, start: 50 }}>
				<ViewportProbes prefix="in" keep={keep} />
			</ToastViewport>
		) : null}
		<Button id="vp2-toggle" label="Toggle VP2" clickAction={() => setVp2Mounted(!vp2Mounted)} />
		<Toast id="inline-toast" type="error" isAutoHide={false} body="inline-toast-body" />
		<Text id="picked">{mark}</Text>
	</View>
}
