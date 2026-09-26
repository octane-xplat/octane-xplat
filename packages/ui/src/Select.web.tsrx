import { useEffect, useRef, useState } from 'octane';
import type { SelectProps, SelectOption } from "./props";
import { Pressable } from './Pressable.web.tsrx';
import { Popover } from './Popover.web.tsrx';
import { TextInput } from './TextInput.web.tsrx';

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

	useEffect(() => {
		if (!open) return;
		const onKey = (e: any) => { if (e.key === 'Escape') setOpen(false); };
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [open]);

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
			bind={(e: any) => { anchor.current = e; }}
			id={props.id}
			className={['vx-select-trigger', props.disabled ? 'vx-select--disabled' : undefined, props.className]}
			style={props.style}
			disabled={props.disabled}
			onPress={() => setOpen(!open)}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityState={{ disabled: props.disabled }}
		>
			<span className={['vx-select-value', selected.length ? undefined : 'vx-select-placeholder']}>{triggerText}</span>
			<span className="vx-select-caret" aria-hidden="true">▾</span>
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
			<div role="listbox" aria-multiselectable={props.multiple || undefined} className="vx-menu-list vx-select-list">
				{shown.map((opt: SelectOption) => {
					const isSelected = selected.includes(opt.value);
					return (
						<div
							key={opt.value}
							role="option"
							aria-selected={isSelected}
							aria-disabled={opt.disabled || undefined}
							tabIndex={opt.disabled ? undefined : 0}
							className={['vx-menu-item', 'vx-select-option', isSelected ? 'vx-select-option--on' : undefined, opt.disabled ? 'vx-menu-item--disabled' : undefined]}
							onClick={opt.disabled ? undefined : () => pick(opt)}
							onKeyDown={(e: any) => {
								if (!opt.disabled && (e.key === ' ' || e.key === 'Enter')) {
									e.preventDefault();
									pick(opt);
								}
							}}
						>
							<span className="vx-select-check" aria-hidden="true">{isSelected ? '✓' : ''}</span>
							<span className="vx-menu-item-label">{opt.label ?? opt.value}</span>
						</div>
					);
				})}
			</div>
		</Popover>
	</>
}
