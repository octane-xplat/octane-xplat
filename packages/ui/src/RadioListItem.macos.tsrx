/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useContext, useRef } from 'octane'
import { cx } from '@octane-xplat/lib'
import type { RadioListItemProps } from './props'
import { RadioListContext } from './option-list-contexts'
import { RadioIndicator } from './RadioIndicator.macos.tsrx'
import { useIndicator } from './use-indicator'
import { indicatorScope } from './indicators'
import { AppKitRadioViewsContext } from './radio-focus-context.macos'

/** Options and child parts use one group owner and identical native semantics. */
export function RadioListItem(props: RadioListItemProps) @{
	const group = useContext(RadioListContext)
	const views = useContext(AppKitRadioViewsContext)
	const own = useRef<NSView | null>(null)
	const bind = useCallback((view: NSView | null) => {
		if (own.current && views?.get(props.value) === own.current) views.delete(props.value)
		own.current = view
		if (view) views?.set(props.value, view)
	}, [views, props.value])
	const Ind = useIndicator('radio') ?? RadioIndicator
	const checked = group?.selected === props.value
	const disabled = Boolean(group?.isDisabled || props.isDisabled)
	const blocked = disabled || group?.isReadOnly
	<masonview ref={bind} id={props.id} className={cx('vx-radio-row', 'vx-radiolist-item', 'vx-radio-row--appkit', indicatorScope,
		checked && 'vx-radio--on', disabled && 'vx-radio--disabled', group?.isReadOnly && 'vx-radio--readonly', props.className)}
		style={props.style} accessibilityRole={group ? 'radio' : undefined}
		accessibilityLabel={group ? props.label ?? props.value : undefined} accessibilityHint={props.description}
		accessibilityState={{ checked, selected: checked, disabled, readonly: group?.isReadOnly }}
		onTap={!blocked && group?.select ? () => group.select?.(props.value) : undefined}>
		<Ind state={checked ? 'checked' : 'unchecked'} size={group?.size === 'sm' ? 'sm' : 'md'} isDisabled={disabled} />
		<masonview className="vx-radio-label-col--appkit">
			{props.label != null ? <label className="vx-radio-label" text={props.label} /> : null}
			{props.description != null ? <label className="vx-radio-description" text={props.description} /> : null}
		</masonview>
		{props.endContent != null ? <masonview className="vx-radio-end--appkit">{props.endContent}</masonview> : null}
	</masonview>
}
