import { useEffect, useRef, useState } from 'octane';
import type { SelectProps, SelectOption } from "./props";
import { Pressable } from './Pressable.web.tsrx';
import { Popover } from './Popover.web.tsrx';
import { TextInput } from './TextInput.web.tsrx';
import { FieldProvider, useFieldControlProps } from './field-context';

/** Select — anchored self-drawn listbox on every target (decision #48).
 *  `multiple` toggles options without closing and reports string[];
 *  `searchable` filters the list through a normalized TextInput — that
 *  combination is what Nuxt calls Combobox/InputMenu/SelectMenu. */
export function Select(inputProps: SelectProps) @{
	const props = useFieldControlProps(inputProps);
	const anchor = useRef<any>(null);
	const [internalOpen, setInternalOpen] = useState(props.defaultOpen ?? false);
	const openControlled = props.open !== undefined;
	const open = openControlled ? props.open : internalOpen;

	const norm = (v: string | string[] | null | undefined) =>
		v == null ? [] : Array.isArray(v) ? v : [v];

	const [internalValue, setInternalValue] = useState<string[]>(norm(props.defaultValue));
	const valueControlled = props.value !== undefined;
	const selected = valueControlled ? norm(props.value) : internalValue;
	const isBlocked = props.isDisabled || props.isReadOnly;

	const [query, setQuery] = useState('');

	const setOpen = (next: boolean) => {
		if (isBlocked && next) return;
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

	const report = (keys: string[], cleared = false) => {
		if (!valueControlled) setInternalValue(keys);
		props.onValueChange?.(props.multiple ? keys : keys[0] ?? null);
		if (cleared) props.onClear?.();
	};

	const clear = () => {
		if (!props.hasClear || isBlocked) return;
		report([], true);
		setOpen(false);
	};

	const pick = (opt: SelectOption) => {
		if (isBlocked || opt.isDisabled) return;
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
			className={['vx-select-trigger', props.isDisabled ? 'vx-select--disabled' : undefined, props.isReadOnly ? 'vx-select--readonly' : undefined, props.isLoading ? 'vx-select--loading' : undefined, props.status ? `vx-select--status-${props.status.type}` : undefined, props.size ? `vx-select--size-${props.size}` : undefined, props.className]}
			style={props.style}
			disabled={props.isDisabled}
			onPress={() => { if (!isBlocked) setOpen(!open); }}
			accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={{ disabled: props.isDisabled }}
			web={{
				'aria-label': props.ariaLabel,
				'aria-labelledby': props.ariaLabelledBy,
				'aria-describedby': props.ariaDescribedBy,
				'aria-readonly': props.isReadOnly || undefined,
				'aria-busy': props.isLoading || undefined,
				'aria-required': props.isRequired && !props.isOptional || undefined,
				'aria-invalid': props.status?.type === 'error' || undefined,
			}}
		>
			<span className={['vx-select-value', selected.length ? undefined : 'vx-select-placeholder']}>{triggerText}</span>
			{props.hasClear && selected.length && !isBlocked ? <button type="button" className="vx-select-clear" aria-label="Clear selection" onClick={(e: any) => { e.stopPropagation(); clear(); }}>×</button> : null}
			{props.isLoading ? <span className="vx-select-loading" role="status">Loading…</span> : null}
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
				? <FieldProvider value={null}><TextInput
					className="vx-select-search"
					accessibilityLabel="Search options"
					placeholder="Search…"
					value={query}
					onChange={setQuery}
				/></FieldProvider>
				: null}
			<div role="listbox" aria-multiselectable={props.multiple || undefined} aria-busy={props.isLoading || undefined} className="vx-menu-list vx-select-list">
				{props.isLoading ? <div className="vx-select-loading" role="status">Loading…</div> : null}
				{shown.map((opt: SelectOption) => {
					const isSelected = selected.includes(opt.value);
					return (
						<div
							key={opt.value}
							role="option"
							aria-selected={isSelected}
							aria-disabled={opt.isDisabled || undefined}
							tabIndex={opt.isDisabled ? undefined : 0}
							className={['vx-menu-item', 'vx-select-option', isSelected ? 'vx-select-option--on' : undefined, opt.isDisabled ? 'vx-menu-item--disabled' : undefined]}
							onClick={opt.isDisabled ? undefined : () => pick(opt)}
							onKeyDown={(e: any) => {
								if (!opt.isDisabled && (e.key === ' ' || e.key === 'Enter')) {
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
