/** @jsxImportSource @octane-xplat/macos-renderer */
import { useImperativeHandle, useEffect, useId, useRef, useState } from 'octane';
import type { ComplexSelectorHandle, ComplexSelectorProps } from './props';
import { cx } from './cx';
import { FormField } from './FormField.macos.tsrx';
import { Popover } from './surfaces.macos.tsrx';
import { Pressable } from './Pressable.macos.tsrx';
import { Icon } from './Icon.macos.tsrx';
import { ActivityIndicator } from './controls.macos.tsrx';

/** Field trigger and anchored render-function surface for custom pickers. */
export function ComplexSelector<Value,>(props: ComplexSelectorProps<Value>) @{
	const triggerId = useId();
	const contentId = useId();
	const anchor = useRef<any>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [isBusy, setIsBusy] = useState(false);
	const [optimisticValue, setOptimisticValue] = useState(props.value);

	if (optimisticValue !== props.value && !isBusy) setOptimisticValue(props.value);

	const setOpen = (next: boolean) => {
		setIsOpen(next);
		props.onOpenChange?.(next);
		if (!next) { anchor.current?.focus?.(); anchor.current?.requestFocus?.(); }
	};

	const handle: ComplexSelectorHandle = {
		open: () => setOpen(true),
		close: () => setOpen(false),
		toggle: () => setOpen(!isOpen),
		isOpen: () => isOpen,
	};

	useImperativeHandle(props.ref, () => handle, [props.ref, isOpen]);

	const commit = async (next: Value) => {
		const previous = optimisticValue;
		setOptimisticValue(next);
		props.onChange?.(next);
		if (!props.changeAction) return;
		setIsBusy(true);
		try {
			await props.changeAction(next);
		} catch {
			setOptimisticValue(previous);
			props.onChange?.(previous);
		} finally {
			setIsBusy(false);
		}
	};

	const content = props.children(optimisticValue, commit, () => setOpen(false), { isOpen, isBusy: isBusy || Boolean(props.isLoading), triggerId, contentId });

	const trigger = <Pressable
		id={triggerId}
		ref={(view: any) => { anchor.current = view; }}
		className={cx('vx-complex-selector-trigger', `vx-complex-selector-trigger--${props.variant ?? 'input'}`)}
		disabled={props.isDisabled || props.isReadOnly || isBusy}
		accessibilityLabel={props.label}
		accessibilityHint={props.description}
		accessibilityRole="button"
		accessibilityState={{ expanded: isOpen, disabled: props.isDisabled || isBusy } as any}
		onPress={() => setOpen(!isOpen)}
	>
		{typeof props.startIcon === 'string' ? <Icon name={props.startIcon} size={16} /> : props.startIcon}
		<label className={cx('vx-complex-selector-value', props.triggerLabel == null && props.value == null && 'vx-complex-selector-placeholder')}
			text={props.triggerLabel ?? (props.value == null ? props.placeholder ?? '' : String(props.value))} />
		{props.isLoading || isBusy ? <ActivityIndicator busy={true} /> : null}
	</Pressable>;

	const body = <>
		{props.variant === 'ghost' ? trigger : <flexboxlayout
			className={cx('vx-complex-selector', `vx-complex-selector--size-${props.size ?? 'md'}`, props.status && `vx-complex-selector--status-${props.status.type}`)}
			flexDirection="row"
			alignItems="center"
		>
			{trigger}
		</flexboxlayout>}
		<Popover anchor={anchor} open={isOpen} placement={props.placement ?? 'bottom'} alignment={props.alignment ?? 'start'} onDismiss={() => setOpen(false)} className={props.contentClassName} style={props.contentXstyle}>
			<gridlayout id={contentId} accessibilityRole={"dialog" as any}>{content}</gridlayout>
		</Popover>
	</>;

	if (props.variant === 'ghost') return body;

	<FormField
		id={props.id}
		label={props.label}
		description={props.description}
		isLabelHidden={props.isLabelHidden}
		isRequired={props.isRequired}
		isOptional={props.isOptional}
		isDisabled={props.isDisabled}
		isReadOnly={props.isReadOnly}
		isLoading={props.isLoading || isBusy}
		status={props.status}
		statusVariant={props.statusVariant}
		labelTooltip={props.labelTooltip}
		size={props.size}
		className={props.className}
		style={{ ...(props.width != null ? { width: props.width } : {}), ...props.style }}
	>
		{body}
	</FormField>
}
