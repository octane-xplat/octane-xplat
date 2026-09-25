import { useRef } from 'octane';
import type { ViewProps } from './props';
import { applyEscapeProps } from './escape-props';
import { glassClassOf, glassStyleOf } from './glass';
import { layoutChildProps } from './layout-child.web';
import { usePan } from './pan.web.tsrx';

/** Neutral flex-column container — the RN-shaped default block.
 *  onPan is pointer plumbing: pointerdown/move/up on the element.
 *  pointermove isn't in octane's delegated-event set, so the leaf attaches
 *  raw listeners via a ref — that's why `bind` exists. Payloads normalize
 *  to the shared shape {x,y,dx,dy,vx,vy,state,target}. */
export function View(props: ViewProps) @{
	const el = useRef<HTMLElement | null>(null);
	usePan(el, props.onPan);

	<div
		id={props.id}
		ref={(e: any) => { el.current = e; if (e) { applyEscapeProps(e, props); props.bind?.(e); } }}
		className={['vx-view', glassClassOf(props.glass), props.className]}
		{...layoutChildProps(props, { ...glassStyleOf(props.glass), ...props.style })}
	>
		{props.children}
	</div>
}
