import type { ComplexSelectorViewProps } from './complex-selector-view';
import { cx } from '@octane-xplat/lib';
import { Popover } from './Popover.web.tsrx';
import { Icon } from './Icon.web.tsrx';
import { Tooltip } from './Tooltip.web.tsrx';

/** Internal resolved presentation, sharing the handle’s host anchor. */
export function ComplexSelectorView<Value,>(props: ComplexSelectorViewProps<Value>) @{
	const { open, pending } = props.state;
	const { triggerId, contentId, anchor } = props;
	const setOpen = props.onOpenChange;
	const trigger = <button
		ref={(el: any) => { anchor.current = el; }}
		type="button"
		id={triggerId}
		className={cx('vx-complex-selector-trigger', `vx-complex-selector-trigger--${props.variant ?? 'input'}`, props.className)}
		aria-controls={contentId}
		disabled={props.isDisabled || props.isReadOnly || pending || props.isLoading}
		aria-label={props.label}
		aria-expanded={open}
		aria-haspopup="dialog"
		onClick={() => setOpen(!open)}
	>
		{typeof props.startIcon === 'string' ? <Icon name={props.startIcon} size={16} /> : props.startIcon}
		<span className={cx('vx-complex-selector-value', props.triggerLabel == null && props.value == null && 'vx-complex-selector-placeholder')}>
			{props.triggerLabel ?? (props.value == null ? props.placeholder ?? '' : String(props.value))}
		</span>
		{props.isLoading || pending ? <span className="vx-complex-selector-spinner" role="status" aria-label="Loading" /> : null}
	</button>;

	const content = <div id={contentId} role="dialog">{props.children(props.state.value, props.onChange, () => setOpen(false), { isOpen: open, isBusy: pending || Boolean(props.isLoading), triggerId, contentId })}</div>;
	const label = props.label != null && !props.isLabelHidden
		? <label className="vx-field-label" htmlFor={triggerId}>{props.isRequired && !props.isOptional ? `${props.label} *` : props.isOptional ? `${props.label} (Optional)` : props.label}</label>
		: null;

	const labelWithTooltip = props.labelTooltip && label
		? <Tooltip trigger={<div className="vx-field-label-row">{label}<button type="button" className="vx-field-info" aria-label={`More about ${props.label}`} onClick={(event: any) => event.preventDefault()}>i</button></div>} content={props.labelTooltip} placement="top" />
		: label;

	const popup = <Popover anchor={anchor} open={open} placement={props.placement ?? 'bottom'} alignment={props.alignment ?? 'start'} onDismiss={() => setOpen(false)} className={props.contentClassName} style={props.contentStyle}>{content}</Popover>;
	if (props.variant === 'ghost') return <>{trigger}{popup}</>;

	<div id={props.id} className={cx('vx-field', props.status && `vx-field--${props.status.type}`, props.statusVariant === 'detached' && 'vx-field--status-detached', props.isDisabled && 'vx-field--disabled', props.className)} style={{ ...(props.width != null ? { width: props.width } : {}), ...(props.style as any) }}>
		{labelWithTooltip}
		{props.description && !props.isLabelHidden ? <div className="vx-field-description">{props.description}</div> : null}
		{trigger}
		{props.status?.message ? <div className={cx('vx-field-status', `vx-field-status--${props.status.type}`, props.statusVariant === 'detached' && 'vx-field-status--detached')}>{props.status.message}</div> : null}
		{popup}
	</div>
}
