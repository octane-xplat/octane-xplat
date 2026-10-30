/** @jsxImportSource @octane-xplat/jsx */
import { useContext, useMemo, useRef } from 'octane'
import type { NSView } from '@octane-xplat/platform/macos'
import { cx } from '@octane-xplat/lib'
import type { RadioListItemProps } from '../../props'
import { RadioListContext } from './option-list-contexts'
import { RadioIndicator } from './RadioIndicator.macos.tsrx'
import { useIndicator } from '../feedback/use-indicator'
import { indicatorScope } from '../feedback/indicators'
import { AppKitRadioViewsContext } from './radio-focus-context.macos'

/** Options and child parts use one group owner and identical native semantics. */
export function RadioListItem(props: RadioListItemProps): unknown @{
	const group = useContext(RadioListContext)
	const views = useContext(AppKitRadioViewsContext)
	const live = useRef({ props, group, views })
	live.current = { props, group, views }
	const own = useRef<{ view: NSView } | null>(null)
	const bind = useMemo(() => {
		let lease: { view: NSView } | null = null
		return (view: NSView | null) => {
			if (lease) {
				if (views?.get(props.value) === lease.view) {
					views.delete(props.value)
				}

				if (own.current === lease) {
					own.current = null
				}
			}

			lease = view ? { view } : null
			if (lease) {
				own.current = lease
				views?.set(props.value, lease.view)
			}
		}
	}, [views, props.value])

	const activate = () => {
		const current = live.current
		if (
			!own.current ||
			current.props.isDisabled ||
			current.group?.isDisabled ||
			current.group?.isReadOnly ||
			(current.views && current.views.get(current.props.value) !== own.current.view)
		) {
			return
		}

		current.group?.select?.(current.props.value)
	}

	const Ind = useIndicator('radio') ?? RadioIndicator
	const checked = group?.selected === props.value
	const disabled = Boolean(group?.isDisabled || props.isDisabled)
	const blocked = disabled || group?.isReadOnly

	<masonview
		ref={bind}
		id={props.id}
		className={cx(
			'vx-radio-row',
			'vx-radiolist-item',
			'vx-radio-row--appkit',
			indicatorScope,
			checked && 'vx-radio--on',
			disabled && 'vx-radio--disabled',
			group?.isReadOnly && 'vx-radio--readonly',
			props.className,
		)}
		style={props.style}
		accessibilityRole={group ? 'radio' : undefined}
		accessibilityLabel={group ? (props.label ?? props.value) : undefined}
		accessibilityHint={props.description}
		accessibilityState={{ checked, selected: checked, disabled, readonly: group?.isReadOnly }}
		onTap={!blocked && group?.select ? activate : undefined}
	>
		<Ind
			state={checked ? 'checked' : 'unchecked'}
			size={group?.size === 'sm' ? 'sm' : 'md'}
			isDisabled={disabled}
		/>
		<masonview className="vx-radio-label-col--appkit">
			{props.label != null ? <label className="vx-radio-label" text={props.label} /> : null}
			{props.description != null ? (
				<label className="vx-radio-description" text={props.description} />
			) : null}
		</masonview>
		{props.endContent != null ? (
			<masonview className="vx-radio-end--appkit">{props.endContent}</masonview>
		) : null}
	</masonview>
}
