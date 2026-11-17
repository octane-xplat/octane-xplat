/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { StepperProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'

/** Stepper — numbered step row with connectors. Steps before `current`
 *  show a done mark; tapping a non-disabled step calls `onStepChange`. */
export function Stepper(props: StepperProps): unknown @{
  const current = props.current ?? 0

  <masonview
    ref={(v: any) => void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))}
    id={props.id}
    className={['vx-stepper', props.className]}
    style={mergeStyle({ flexDirection: 'row' }, mergeStyle({ display: 'flex' }, props.style))}
  >
    @for (const e of (props.steps ?? []).map((step, i) => ({ step, i })); key e.step.key) {
      <masonview
        className="vx-stepper-cell"
        style={mergeStyle(
          { flexDirection: 'row', alignItems: 'center' },
          { display: 'flex' },
        )}
      >
        @if (e.i > 0) {
          <masonview
            className={['vx-stepper-line', e.i <= current && 'vx-stepper-line--done']}
            style={mergeStyle(
              { display: 'flex' },
              {
                width: 24,
                height: 1,
                backgroundColor: e.i <= current ? '#171717' : '#eaeaea',
              },
            )}
          />
        }
        <masonview
          className={[
            'vx-step',
            e.i < current && 'vx-step--done',
            e.i === current && 'vx-step--on',
            e.step.disabled && 'vx-step--disabled',
          ]}
          onTap={e.step.disabled ? undefined : () => props.onStepChange?.(e.i)}
          style={mergeStyle(
            { flexDirection: 'row', alignItems: 'center' },
            { display: 'flex' },
          )}
        >
          <label
            className="vx-step-dot"
            style={mergeStyle(
              {
                width: 24,
                height: 24,
                fontSize: 12,
                textAlign: 'center',
                borderWidth: 1,
                borderRadius: 12,
              },
              e.i < current
                ? { backgroundColor: '#171717', borderColor: '#171717', color: '#fafafa' }
                : {
                    borderColor: e.i === current ? '#171717' : '#eaeaea',
                    color: e.i === current ? '#171717' : '#666666',
                  },
            )}
            text={e.i < current ? '✓' : String(e.i + 1)}
          />
          @if (e.step.label != null) {
            <label
              className="vx-step-label"
              style={{ marginLeft: 6 }}
              text={e.step.label}
            />
          }
        </masonview>
      </masonview>
    }
  </masonview>
}
