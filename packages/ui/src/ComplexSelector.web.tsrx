import { useEffect, useId, useRef, useState } from 'octane';
import type { ComplexSelectorHandle, ComplexSelectorProps } from './props';
import { cx } from './cx';
import { Popover } from './Popover.web.tsrx';
import { Icon } from './Icon.web.tsrx';
import { Tooltip } from './Tooltip.web.tsrx';

/** Web field trigger and anchored render-function surface for custom pickers. */
export function ComplexSelector<Value,>(props: ComplexSelectorProps<Value>) @{
	const triggerId = useId();
	const contentId = useId();
	const anchor = useRef<HTMLElement | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [isBusy, setIsBusy] = useState(false);
	const [optimisticValue, setOptimisticValue] = useState(props.value);
	useEffect(() => { setOptimisticValue(props.value); }, [props.value]);

	const setOpen = (next: boolean) => {
		setIsOpen(next);
		props.onOpenChange?.(next);
		if (!next) anchor.current?.focus?.();
	};
	const handle: ComplexSelectorHandle = {
		open: () => setOpen(true), close: () => setOpen(false),
		toggle: () => setOpen(!isOpen), isOpen: () => isOpen,
	};
	useEffect(() => { props.bind?.(handle); }, [props.bind, isOpen]);

	const commit = async (next: Value) => {
		const previous = optimisticValue;
		setOptimisticValue(next);
		props.onChange?.(next);
		if (!props.changeAction) return;
		setIsBusy(true);
		try { await props.changeAction(next); }
		catch { setOptimisticValue(previous); props.onChange?.(previous); }
		finally { setIsBusy(false); }
	};
	const trigger = <button
		ref={(el: any) => { anchor.current = el; }}
		type="button"
		id={triggerId}
		className={cx('vx-complex-selector-trigger', `vx-complex-selector-trigger--${props.variant ?? 'input'}`, props.className)}
		aria-controls={contentId}
		disabled={props.isDisabled || props.isReadOnly || isBusy || props.isLoading}
		aria-label={props.label}
		aria-expanded={isOpen}
		aria-haspopup="dialog"
		onClick={() => setOpen(!isOpen)}
	>
		{typeof props.startIcon === 'string' ? <Icon name={props.startIcon} size={16} /> : props.startIcon}
		<span className={cx('vx-complex-selector-value', props.triggerLabel == null && props.value == null && 'vx-complex-selector-placeholder')}>
			{props.triggerLabel ?? (props.value == null ? props.placeholder ?? '' : String(props.value))}
		</span>
		{props.isLoading || isBusy ? <span className="vx-complex-selector-spinner" role="status" aria-label="Loading" /> : null}
	</button>;
	const content = <div id={contentId} role="dialog">{props.children(optimisticValue, commit, () => setOpen(false), { isOpen, isBusy: isBusy || Boolean(props.isLoading), triggerId, contentId })}</div>;
	const label = props.label != null && !props.isLabelHidden
		? <label className="vx-field-label" htmlFor={triggerId}>{props.isRequired && !props.isOptional ? `${props.label} *` : props.isOptional ? `${props.label} (Optional)` : props.label}</label>
		: null;
	const labelWithTooltip = props.labelTooltip && label
		? <Tooltip trigger={<div className="vx-field-label-row">{label}<button type="button" className="vx-field-info" aria-label={`More about ${props.label}`} onClick={(event: any) => event.preventDefault()}>i</button></div>} content={props.labelTooltip} placement="top" />
		: label;
	const popup = <Popover anchor={anchor} open={isOpen} placement={props.placement ?? 'bottom'} alignment={props.alignment ?? 'start'} onDismiss={() => setOpen(false)} className={props.contentClassName} style={props.contentXstyle}>{content}</Popover>;
	if (props.variant === 'ghost') return <>{trigger}{popup}</>;

	<div id={props.id} className={cx('vx-field', props.status && `vx-field--${props.status.type}`, props.statusVariant === 'detached' && 'vx-field--status-detached', props.isDisabled && 'vx-field--disabled', props.className)} style={{ ...(props.width != null ? { width: props.width } : {}), ...props.style }}>
		{labelWithTooltip}
		{props.description && !props.isLabelHidden ? <div className="vx-field-description">{props.description}</div> : null}
		{trigger}
		{props.status?.message ? <div className={cx('vx-field-status', `vx-field-status--${props.status.type}`, props.statusVariant === 'detached' && 'vx-field-status--detached')}>{props.status.message}</div> : null}
		{popup}
	</div>
}
