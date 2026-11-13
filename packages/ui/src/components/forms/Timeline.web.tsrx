/** @jsxImportSource @octane-xplat/jsx/dom */
import type { TimelineProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { Icon } from '../media/Icon.web.tsrx'
import type { JSX } from 'octane/jsx-runtime'

/** Timeline — vertical event list: dot + connector + content per item. */
export function Timeline(props: TimelineProps): JSX.Element @{
  <div
    ref={(e: any) => applyEscapeProps(e, props)}
    id={props.id}
    className={['vx-timeline', props.className]}
    style={props.style}
  >
    {props.items.map((item: any, i: number) => (
      <div key={item.key} className="vx-timeline-item">
        <div className="vx-timeline-rail" aria-hidden="true">
          <div className="vx-timeline-dot">
            @if (item.icon) {
              <Icon name={item.icon} />
            }
          </div>
          @if (i < props.items.length - 1) {
            <div className="vx-timeline-line" />
          }
        </div>
        <div className="vx-timeline-body">
          @if (item.time != null) {
            <span className="vx-timeline-time">{item.time}</span>
          }
          @if (item.title != null) {
            <span className="vx-timeline-title">{item.title}</span>
          }
          @if (item.description != null) {
            <span className="vx-timeline-desc">{item.description}</span>
          }
        </div>
      </div>
    ))}
  </div>
}
