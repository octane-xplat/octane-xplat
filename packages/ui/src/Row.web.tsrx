import { useRef } from 'octane';
import type { RowProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { glassClassOf, glassStyleOf } from './glass';
import { layoutChildProps } from './layout-child.web';
import { usePan } from './pan.web.tsrx';
export function Row(props: RowProps) @{
	const el = useRef<HTMLElement | null>(null);
	usePan(el, props.onPan);

	<div id={props.id} ref={(e: any) => { el.current = e; if (e) { applyEscapeProps(e, props); props.bind?.(e); } }} className={['vx-row', glassClassOf(props.glass), props.className]} {...layoutChildProps(props, { ...glassStyleOf(props.glass), ...props.style })}>
		{props.children}
	</div>
}
