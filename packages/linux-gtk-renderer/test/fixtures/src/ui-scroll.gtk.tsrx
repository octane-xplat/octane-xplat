/** @jsxImportSource @octane-xplat/jsx */
import { useScrollableArea } from '@octane-xplat/ui'
import type { HostElement } from '@octane-xplat/jsx/intrinsics'
import type { ScrollAxis } from '@octane-xplat/ui'

export const scrollRefs: { viewport: any; content: any; state: any } = { viewport: null, content: null, state: null }
const viewportRef = (view: any) => { scrollRefs.viewport = view }
const contentRef = (view: any) => { scrollRefs.content = view }

export function Scrollable(props: { axis: ScrollAxis; width: number; height: number; hidden?: boolean }) @{
	const area = useScrollableArea<HostElement>({ axis: props.axis })
	scrollRefs.state = area.state

	<scrollview
		{...area.getViewportProps({ ref: viewportRef })}
		id="scroll-viewport"
		orientation={props.axis === 'both' ? 'both' : props.axis === 'inline' ? 'horizontal' : 'vertical'}
		scrollBarIndicatorVisible={!props.hidden}
		style={{ width: 200, height: 100 }}
	>
		<masonview {...area.getContentProps({ ref: contentRef })} id="scroll-content" style={{ width: props.width, height: props.height }} />
	</scrollview>
}
