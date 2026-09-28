/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef, useState } from 'octane';
import type { SearchInputProps } from './props';
import { Icon } from './Icon.tsrx';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { writeText } from './text-write';

/** Chrome-reset search field — a styled TextField (not UISearchBar) with a
 *  leading glyph and a self-drawn clear button, matching the web leaf.
 *  Controlled `value` writes go through `writeText` so Android keeps its
 *  selection (same path as TextInput); `defaultValue` seeds uncontrolled
 *  use. `returnKeyType` is fixed 'search' — the normalized chrome. */
export function SearchInput(props: SearchInputProps) @{
	const el = useRef<any>(null);
	const [internal, setInternal] = useState(props.defaultValue ?? '');
	const value = props.value ?? internal;
	useEffect(() => writeText(el.current, value), [value]);

	const setValue = (next: string) => {
		if (props.value === undefined) setInternal(next);
		props.onChange?.(next);
	};

	const clear = () => {
		setValue('');
		props.onClear?.();
	};

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection="row"
		className={cx('vx-search', props.editable === false && 'vx-search--disabled', props.className)}
		style={props.style}
		accessibilityLabel={props.accessibilityLabel}
	>
		{props.icon !== false ? <Icon name={props.icon ?? 'xplat-search'} size={16} className="vx-search-icon" /> : null}
		<textfield
			ref={(v: any) => {
				el.current = v;
				if (!v) return;
				props.bind?.({ focus: () => v.focus(), blur: () => v.dismissSoftInput?.() ?? v.blur(), native: v });
			}}
			className="vx-search-field"
			hint={props.placeholder}
			returnKeyType="search"
			editable={props.editable ?? true}
			onTextChange={(e: any) => setValue(e.value)}
			onReturnPress={props.onSubmit}
			onFocus={props.onFocus}
			onBlur={props.onBlur}
		/>
		{value !== '' && props.editable !== false ? (
			<flexboxlayout className="vx-search-clear" accessibilityLabel="Clear search" onTap={clear}>
				<Icon name="xplat-clear" size={12} />
			</flexboxlayout>
		) : null}
	</flexboxlayout>
}
