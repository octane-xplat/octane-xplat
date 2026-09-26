import { useState } from 'octane';
import type { SearchInputProps } from './props';
import { Icon } from './Icon.web.tsrx';
import { applyWebProps } from './platformProps.web';
import { normStyle } from './layout-child.web';

/** Chrome-reset search field — an `<input type="search">` in a bordered
 *  shell with a leading glyph and a self-drawn clear button (the engine's
 *  own ::-webkit-search-cancel-button is hidden — same pixels as native).
 *  `value`/`onChange` for controlled, `defaultValue` for uncontrolled. */
export function SearchInput(props: SearchInputProps) @{
	const [internal, setInternal] = useState(props.defaultValue ?? '');
	const value = props.value ?? internal;
	const setValue = (next: string) => {
		if (props.value === undefined) setInternal(next);
		props.onChange?.(next);
	};

	const clear = () => {
		setValue('');
		props.onClear?.();
	};

	<div
		ref={(el: any) => applyWebProps(el, props.web)}
		id={props.id}
		className={['vx-search', props.editable === false ? 'vx-search--disabled' : undefined, props.className]}
		style={normStyle(props.style)}
	>
		{props.icon !== false ? <Icon name={props.icon ?? 'xplat-search'} size={16} className="vx-search-icon" /> : null}
		<input
			ref={(el: any) => {
				if (el) props.bind?.({ focus: () => el.focus(), blur: () => el.blur(), native: el });
			}}
			type="search"
			className="vx-search-field"
			value={value}
			placeholder={props.placeholder}
			aria-label={props.accessibilityLabel ?? props.placeholder}
			readOnly={props.editable === false}
			enterKeyHint="search"
			onInput={(e: any) => setValue(e.target.value)}
			onKeyDown={(e: any) => {
				if (e.key === 'Enter' && !e.shiftKey) props.onSubmit?.();
			}}
			onFocus={props.onFocus}
			onBlur={props.onBlur}
		/>
		{value !== '' && props.editable !== false ? (
			<button type="button" className="vx-search-clear" aria-label="Clear search" onClick={clear}>
				<Icon name="xplat-clear" size={12} />
			</button>
		) : null}
	</div>
}
