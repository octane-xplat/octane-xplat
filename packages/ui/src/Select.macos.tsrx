/** @jsxImportSource @xplat/macos/renderer */
import { useRef, useState } from 'octane';
import type { SelectProps, SelectOption } from "./props";
import { cx } from "./cx";
import { Pressable } from './Pressable.macos.tsrx';
import { Popover } from './Popover.macos.tsrx';
import { TextInput } from './text-controls.macos.tsrx';

/** Select — anchored self-drawn listbox on every target (decision #48).
 *  `multiple` toggles options without closing and reports string[];
 *  `searchable` filters the list through a normalized TextInput — that
 *  combination is what Nuxt calls Combobox/InputMenu/SelectMenu. */
export function Select(props: SelectProps) @{
	const anchor = useRef<any>(null);
	const [internalOpen, setInternalOpen] = useState(props.defaultOpen ?? false);
	const openControlled = props.open !== undefined;
	const open = openControlled ? props.open : internalOpen;

	const norm = (v: string | string[] | undefined) =>
		v === undefined ? [] : Array.isArray(v) ? v : [v];

	const [internalValue, setInternalValue] = useState<string[]>(norm(props.defaultValue));
	const valueControlled = props.value !== undefined;
	const selected = valueControlled ? norm(props.value) : internalValue;

	const [query, setQuery] = useState('');

	const setOpen = (next: boolean) => {
		if (props.disabled && next) return;
		if (!openControlled) setInternalOpen(next);
		if (!next) setQuery('');
		props.onOpenChange?.(next);
	};

	const report = (keys: string[]) => {
		if (!valueControlled) setInternalValue(keys);
		props.onValueChange?.(props.multiple ? keys : keys[0]);
	};

	const pick = (opt: SelectOption) => {
		if (opt.disabled) return;
		if (props.multiple) {
			report(selected.includes(opt.value)
				? selected.filter((v) => v !== opt.value)
				: [...selected, opt.value]);
		} else {
			report([opt.value]);
			setOpen(false);
		}
	};

	const labelFor = (v: string) =>
		props.options.find((o) => o.value === v)?.label ?? v;

	const triggerText = selected.length
		? selected.map(labelFor).join(', ')
		: props.placeholder ?? '';

	const shown = props.searchable && query
		? props.options.filter((o) => (o.label ?? o.value).toLowerCase().includes(query.toLowerCase()))
		: props.options;

	<>
		<Pressable
			bind={(v: any) => { anchor.current = v; }}
			id={props.id}
			className={cx('vx-select-trigger', props.disabled && 'vx-select--disabled', props.className)}
			style={props.style}
			disabled={props.disabled}
			onPress={() => setOpen(!open)}
			accessibilityLabel={props.accessibilityLabel}
		>
			<label className={cx('vx-select-value', !selected.length && 'vx-select-placeholder')} text={triggerText} />
			<label className="vx-select-caret" text="▾" />
		</Pressable>
		<Popover
			anchor={anchor}
			open={open}
			placement={props.placement ?? 'bottom'}
			onDismiss={() => setOpen(false)}
			className="vx-menu"
		>
			{props.searchable
				? <TextInput
					className="vx-select-search"
					placeholder="Search…"
					value={query}
					onChange={setQuery}
				/>
				: null}
			<flexboxlayout className="vx-menu-list vx-select-list">
				@for (const opt of shown; key opt.value) {
					<flexboxlayout
						className={cx('vx-menu-item', 'vx-select-option', selected.includes(opt.value) && 'vx-select-option--on', opt.disabled && 'vx-menu-item--disabled')}
						onTap={opt.disabled ? undefined : () => pick(opt)}
					>
						<label className="vx-select-check" text={selected.includes(opt.value) ? '✓' : ''} />
						<label className="vx-menu-item-label" text={opt.label ?? opt.value} />
					</flexboxlayout>
				}
			</flexboxlayout>
		</Popover>
	</>
}
