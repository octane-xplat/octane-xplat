/** @jsxImportSource @xplat/macos/renderer */
import { useRef, useState } from 'octane';
import type { SelectProps, SelectOption } from "./props";
import { cx } from "./cx";
import { Pressable } from './Pressable.macos.tsrx';
import { Popover } from './Popover.macos.tsrx';
import { TextInput } from './text-controls.macos.tsrx';
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
			bind={(v: any) => { anchor.current = v; }}
			id={props.id}
			className={cx('vx-select-trigger', props.isDisabled && 'vx-select--disabled', props.isReadOnly && 'vx-select--readonly', props.isLoading && 'vx-select--loading', props.status && `vx-select--status-${props.status.type}`, props.size && `vx-select--size-${props.size}`, props.className)}
			style={props.style}
			disabled={props.isDisabled}
			onPress={() => { if (!isBlocked) setOpen(!open); }}
			accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={{ disabled: props.isDisabled }}
		>
			<label className={cx('vx-select-value', !selected.length && 'vx-select-placeholder')} text={triggerText} />
			{props.hasClear && selected.length && !isBlocked ? <Pressable className="vx-select-clear" accessibilityLabel="Clear selection" onPress={clear}><label text="×" /></Pressable> : null}
			{props.isLoading ? <label className="vx-select-loading" text="Loading…" /> : null}
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
				? <FieldProvider value={null}><TextInput
					className="vx-select-search"
					accessibilityLabel="Search options"
					placeholder="Search…"
					value={query}
					onChange={setQuery}
				/></FieldProvider>
				: null}
			<flexboxlayout className="vx-menu-list vx-select-list">
				{props.isLoading ? <label className="vx-select-loading" text="Loading…" accessibilityLiveRegion="polite" /> : null}
				@for (const opt of shown; key opt.value) {
					<flexboxlayout
						className={cx('vx-menu-item', 'vx-select-option', selected.includes(opt.value) && 'vx-select-option--on', opt.isDisabled && 'vx-menu-item--disabled')}
						onTap={opt.isDisabled ? undefined : () => pick(opt)}
					>
						<label className="vx-select-check" text={selected.includes(opt.value) ? '✓' : ''} />
						<label className="vx-menu-item-label" text={opt.label ?? opt.value} />
					</flexboxlayout>
				}
			</flexboxlayout>
		</Popover>
	</>
}
