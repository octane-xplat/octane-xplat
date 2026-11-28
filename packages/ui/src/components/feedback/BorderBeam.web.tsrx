/** @jsxImportSource @octane-xplat/jsx/dom */
import type { JSX } from 'octane/jsx-runtime'
import type { BorderBeamProps } from '../../props'
import { styleRecord } from '../../internal/layout/style-merge'
import { View } from '../layout/View.tsrx'
import { beamDuration, beamInset, beamRadius, beamStrokes } from './border-beam'
import './BorderBeam.web.css'

export type { BorderBeamProps } from '../../props'

export function BorderBeam(props: BorderBeamProps): JSX.Element @{
  const radius = beamRadius(props.radius)

  <View
    id={props.id}
    className={['vx-border-beam', props.className]}
    style={{ ...styleRecord(props.style), borderRadius: radius }}
  >
    {props.children}
    @if (props.active !== false) {
      <svg
        aria-hidden="true"
        focusable="false"
        className="vx-border-beam-stroke"
        style={{
          '--vx-border-beam-inset': `${beamInset}px`,
          '--vx-border-beam-duration': `${beamDuration}ms`,
        }}
      >
        @for (const stroke of beamStrokes; key stroke.length) {
          <rect
            width="100%"
            height="100%"
            rx={Math.max(0, radius - beamInset)}
            pathLength={100}
            fill="none"
            stroke={stroke.color}
            strokeLinecap="round"
            strokeOpacity={stroke.opacity}
            strokeWidth={stroke.width}
            strokeDasharray={`${stroke.length * 100} ${(1 - stroke.length) * 100}`}
            style={{ '--vx-border-beam-offset': stroke.length * 100 }}
          />
        }
      </svg>
    }
  </View>
}
