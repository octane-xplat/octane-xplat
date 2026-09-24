import type { ListProps } from "./props";
import { useLayoutEffect, useRef } from 'octane';

export function List(props: ListProps) @{
	const el = useRef<HTMLDivElement | null>(null);
	const reachedEnd = useRef(false);

	useLayoutEffect(() => {
		const node = el.current;
		if (!node) return;

		for (const [name, value] of Object.entries(props.web ?? {})) {
			if (name.includes('-')) {
				if (value == null) node.removeAttribute(name);
				else node.setAttribute(name, String(value));
			} else {
				(node as any)[name] = value;
			}
		}

		let frame = 0;
		const checkEnd = () => {
			frame = 0;
			const remaining = node.scrollHeight - node.scrollTop - node.clientHeight;
			if (remaining > node.clientHeight) reachedEnd.current = false;
			else if (!reachedEnd.current) {
				reachedEnd.current = true;
				props.onEndReached?.();
			}
		};
		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(checkEnd);
		};
		node.addEventListener('scroll', onScroll, { passive: true });
		checkEnd();
		return () => {
			node.removeEventListener('scroll', onScroll);
			if (frame) cancelAnimationFrame(frame);
		};
	}, [props.onEndReached, props.web, props.items]);

	<div
		id={props.id}
		ref={el}
		className={['vx-list', props.className]}
		style={Object.assign({
			display: 'flex',
			flexDirection: 'column',
			flexWrap: 'nowrap',
			alignItems: 'stretch',
			overflowY: 'auto',
			minHeight: 0,
		}, props.style)}
	>
		@for (const item of props.items; index i; key props.keyFor?.(item) ?? item.id) {
			<>{props.renderItem(item, i)}</>
		} @empty {
			<>{props.renderEmpty?.()}</>
		}
	</div>
}
