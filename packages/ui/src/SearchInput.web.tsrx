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
	const isBlocked = props.isDisabled || props.isReadOnly;
	const hasClear = props.hasClear !== false;
	const setValue = (next: string) => {
		if (isBlocked) return;
		if (props.value === undefined) setInternal(next);
		props.onChange?.(next);
	};

	const clear = () => {
		if (isBlocked || !hasClear) return;
		setValue('');
		props.onClear?.();
	};

	<div
		ref={(el: any) => applyWebProps(el, props.web)}
		id={props.id}
		className={['vx-search', props.isDisabled ? 'vx-search--disabled' : undefined, props.isReadOnly ? 'vx-search--readonly' : undefined, props.isLoading ? 'vx-search--loading' : undefined, props.status ? `vx-search--status-${props.status.type}` : undefined, props.size ? `vx-search--size-${props.size}` : undefined, props.className]}
		style={normStyle(props.style)}
		aria-busy={props.isLoading || undefined}
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
			aria-label={props.accessibilityLabel ?? props.label ?? props.placeholder}
			aria-required={props.isRequired && !props.isOptional || undefined}
			aria-invalid={props.status?.type === 'error' || undefined}
			aria-busy={props.isLoading || undefined}
			disabled={props.isDisabled || undefined}
			readOnly={props.isReadOnly || undefined}
			enterKeyHint="search"
			onInput={(e: any) => setValue(e.target.value)}
			onKeyDown={(e: any) => {
				if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) props.onSubmit?.();
			}}
			onFocus={props.onFocus}
			onBlur={props.onBlur}
		/>
		{value !== '' && hasClear && !isBlocked ? (
			<button type="button" className="vx-search-clear" aria-label="Clear search" onClick={clear}>
				<Icon name="xplat-clear" size={12} />
			</button>
		) : null}
	</div>
}
