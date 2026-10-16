/** @jsxImportSource @octane-xplat/macos-renderer */
import type { ComplexSelectorViewProps } from './complex-selector-view';
import { useSize } from './size-context';
import { cx } from '@octane-xplat/lib';
import { FormField } from './FormField.macos.tsrx';
import { Popover } from './surfaces.macos.tsrx';
import { Pressable } from './Pressable.macos.tsrx';
import { Icon } from './Icon.macos.tsrx';
import { ActivityIndicator } from './controls.macos.tsrx';

/** Internal resolved presentation, sharing the handle’s host anchor. */
export function ComplexSelectorView<Value,>(props: ComplexSelectorViewProps<Value>) @{
	const { open, pending } = props.state;
	const size = useSize(props.size, 'md');
	const { triggerId, contentId, anchor } = props;
	const setOpen = props.onOpenChange;
	const content = props.children({
		value: props.state.value,
		onChange: props.onChange,
		close: () => setOpen(false),
		isOpen: open,
		isBusy: pending || Boolean(props.isLoading),
		triggerId,
		contentId,
	});

	const trigger = <Pressable
		id={triggerId}
		ref={(view: any) => { anchor.current = view; }}
		className={cx('vx-complex-selector-trigger', `vx-complex-selector-trigger--${props.variant ?? 'input'}`)}
		disabled={props.isDisabled || props.isReadOnly || pending}
		accessibilityLabel={props.label}
		accessibilityHint={props.description}
		accessibilityRole="button"
		accessibilityState={{ expanded: open, disabled: props.isDisabled || pending } as any}
		onPress={() => setOpen(!open)}
	>
		{typeof props.startIcon === 'string' ? <Icon name={props.startIcon} size={16} /> : props.startIcon}
		<label className={cx('vx-complex-selector-value', props.triggerLabel == null && props.value == null && 'vx-complex-selector-placeholder')}
			text={(props.triggerLabel as any) ?? (props.value == null ? (props.placeholder as any) ?? '' : String(props.value))} />
		{props.isLoading || pending ? <ActivityIndicator busy={true} /> : null}
	</Pressable>;

	const body = <>
		{props.variant === 'ghost' ? trigger : <flexboxlayout
			className={cx('vx-complex-selector', `vx-complex-selector--size-${size}`, props.status && `vx-complex-selector--status-${props.status.type}`)}
			flexDirection="row"
			alignItems="center"
		>
			{trigger}
		</flexboxlayout>}
		<Popover anchor={anchor} open={open} placement={props.placement ?? 'bottom'} alignment={props.alignment ?? 'start'} onDismiss={() => setOpen(false)} className={props.contentClassName} style={props.contentStyle}>
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
		isLoading={props.isLoading || pending}
		status={props.status}
		statusVariant={props.statusVariant}
		labelTooltip={props.labelTooltip}
		size={props.size}
		className={props.className}
		style={{ ...(props.width != null ? { width: props.width } : {}), ...(props.style as any) }}
	>
		{body}
	</FormField>
}
