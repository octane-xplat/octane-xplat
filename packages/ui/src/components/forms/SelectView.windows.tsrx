/** @jsxImportSource @octane-xplat/jsx */
import 'octane/signals'
import { cx } from '@octane-xplat/lib'
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMeasure$ } from '../layout/useMeasure.tsrx'
import { Icon } from '../media/Icon.tsrx'
import { CheckIndicator } from '../feedback/indicators'
import { useIndicator } from '../feedback/use-indicator.tsrx'
import { SelectView as SharedSelectView } from './SelectView.tsrx'
import type { SelectViewProps } from './select-view'
import './select-control.windows'

/** Single finite selection uses genuine WinUI ComboBox/option peers. Other
 * presentations retain the shared view and its existing qualification limits. */
export function SelectView(props: SelectViewProps): unknown @{
  const measured = useMeasure$()
  const CheckInd = useIndicator('check') ?? CheckIndicator
  const busy = Boolean(props.isLoading || props.pending)
  const blocked = Boolean(props.isDisabled || props.isReadOnly || props.pending)
  const selected = props.options.find((option) => option.value === props.selected[0])

  @if (
    props.multiple ||
    props.searchable ||
    props.hasClear ||
    !props.shown.length ||
    props.groups.some((group) => group.heading != null)
  ) {
    <SharedSelectView {...props} />
  } @else {
    <masonview
      id={props.id}
      testID={props.testID}
      ref={measured.ref}
      className={cx(
        'vx-select-trigger',
        props.isDisabled && 'vx-select--disabled',
        props.isReadOnly && 'vx-select--readonly',
        busy && 'vx-select--loading',
        props.className,
      )}
      style={mergeStyle({ display: 'flex', flexDirection: 'row' }, props.style)}
    >
      {selected && props.renderValue ? (
        props.renderValue(selected)
      ) : (
        <label
          className={cx('vx-select-value', !props.selected.length && 'vx-select-placeholder')}
          text={props.triggerText}
        />
      )}
      {busy ? (
        <label className="vx-select-loading" text="Loading…" accessibilityLiveRegion="polite" />
      ) : null}
      {!props.isReadOnly ? (
        <Icon name="xplat-chevron-down" className="vx-select-caret" size={14} />
      ) : null}
      <xplatwindowsselect
        settings={{
          value: props.selected[0],
          open: props.open,
          blocked,
          label:
            props.accessibilityLabel ??
            props.ariaLabel ??
            props.fieldLabel ??
            props.label ??
            props.triggerText,
          maxMenuHeight: props.maxMenuHeight ?? 280,
          onOpenChange: props.onOpenChange,
          onPick: (value: string) => {
            const option = props.options.find((option) => option.value === value)

            if (option) {
              props.onPick(option)
            }
          },
        }}
        isEnabled={!props.isDisabled}
        accessibilityHint={props.accessibilityHint}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: measured.bounds$.get()?.width ?? 0,
          height: measured.bounds$.get()?.height ?? 0,
        }}
      >
        @for (const option of props.shown; key option.value) {
          <xplatwindowsselectoption
            id={props.id ? `${props.id}-option-${option.value}` : undefined}
            settings={{
              value: option.value,
              label: `${option.label ?? option.value}${option.description ? ', ' + option.description : ''}`,
              disabled: Boolean(option.isDisabled || props.pending),
            }}
          >
            <masonview
              className={cx(
                'vx-menu-item',
                'vx-select-option',
                props.selected.includes(option.value) && 'vx-select-option--on',
                option.isDisabled && 'vx-menu-item--disabled',
              )}
              style={{ display: 'flex', flexDirection: 'row', minHeight: 32 }}
            >
              <masonview className="vx-select-check" style={{ display: 'flex' }}>
                <CheckInd
                  state={props.selected.includes(option.value) ? 'checked' : 'unchecked'}
                  isDisabled={option.isDisabled}
                />
              </masonview>
              {props.renderOption ? (
                props.renderOption(option)
              ) : (
                <masonview style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="vx-menu-item-label" text={option.label ?? option.value} />
                  {option.description ? (
                    <label className="vx-select-description" text={option.description} />
                  ) : null}
                </masonview>
              )}
            </masonview>
          </xplatwindowsselectoption>
        }
      </xplatwindowsselect>
    </masonview>
  }
}
