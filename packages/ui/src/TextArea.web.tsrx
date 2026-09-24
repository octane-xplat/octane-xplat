import { useLayoutEffect, useRef } from 'octane';
import type { TextAreaProps } from "./props";

/** Multiline input — <textarea>. `autoGrow` re-fits height to content after
 *  every commit via scrollHeight, capped by `maxRows` translated to a real
 *  max-height from the element's computed line-height; past the cap the
 *  field scrolls. `useLayoutEffect` so the measure lands pre-paint in the
 *  commit that wrote `value`. Deps are explicit — tsrx infers them from the
 *  closure's reads otherwise, and `props.value` (the thing that changes the
 *  height) isn't read inside. */
export function TextArea(props: TextAreaProps) @{
	const el = useRef<HTMLTextAreaElement | null>(null);

	useLayoutEffect(() => {
		const t = el.current;
		if (!t) return;
		const cs = getComputedStyle(t);
		const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
		const bord = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
		// scrollHeight is always content+padding; CSS height counts padding
		// +border only under border-box — convert between the two metrics.
		const adj = cs.boxSizing === 'border-box' ? bord : -pad;
		const line = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
		const cap = props.maxRows
			? props.maxRows * line + (cs.boxSizing === 'border-box' ? pad + bord : 0)
			: parseFloat(cs.maxHeight) || Infinity;
		if (props.maxRows) t.style.maxHeight = Math.ceil(cap) + 'px';
		if (props.autoGrow) {
			t.style.height = 'auto';
			// scrollHeight ≥ clientHeight at auto — the rows attr is the floor.
			const need = t.scrollHeight + adj;
			t.style.height = Math.min(need, cap) + 'px';
			t.style.overflowY = need > cap ? 'auto' : 'hidden';
		}
	}, [props.value, props.rows, props.autoGrow, props.maxRows, props.className, props.style]);

	<textarea
		id={props.id}
		ref={el}
		className={['vx-textarea', props.className]}
		style={props.style}
		value={props.value}
		placeholder={props.placeholder ?? props.hint}
		rows={props.rows ?? (props.autoGrow ? 1 : 3)}
		onInput={(e: any) => props.onChange?.(e.target.value)}
	/>
}
