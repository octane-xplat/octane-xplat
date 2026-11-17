/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { TimelineProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import { Icon } from '../media/Icon.macos.tsrx'

/** Timeline — vertical event list: dot + connector + content per item. */
export function Timeline(props: TimelineProps): unknown @{
  <masonview
    ref={(v: any) => void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))}
    id={props.id}
    className={['vx-timeline', props.className]}
    style={mergeStyle({ display: 'flex' }, props.style)}
  >
    @for (const e of props.items.map((item, i) => ({ item, i })); key e.item.key) {
      <masonview className="vx-timeline-item" style={{ display: 'flex' }}>
        {/* rail/dot/line metrics are CSS on web — inline equivalents
here (AppKit has no style layer); keep in step with
.vx-timeline-* */}
        <masonview
          className="vx-timeline-rail"
          style={mergeStyle(
            { alignItems: 'center' },
            mergeStyle({ display: 'flex' }, { width: 20 }),
          )}
        >
          <masonview
            className="vx-timeline-dot"
            style={mergeStyle(
              { display: 'flex' },
              { width: 10, height: 10, borderRadius: 5, backgroundColor: '#171717' },
            )}
          >
            @if (e.item.icon) {
              <Icon name={e.item.icon} />
            }
          </masonview>
          @if (e.i < props.items.length - 1) {
            <masonview
              className="vx-timeline-line"
              style={mergeStyle(
                { display: 'flex' },
                { width: 1, backgroundColor: '#d4d4d4' },
              )}
            />
          }
        </masonview>
        <masonview className="vx-timeline-body" style={{ display: 'flex' }}>
          @if (e.item.time != null) {
            <label className="vx-timeline-time" text={e.item.time} />
          }
          @if (e.item.title != null) {
            <label className="vx-timeline-title" text={e.item.title} />
          }
          @if (e.item.description != null) {
            <label className="vx-timeline-desc" text={e.item.description} />
          }
        </masonview>
      </masonview>
    }
  </masonview>
}
