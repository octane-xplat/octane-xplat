/** @jsxImportSource @octane-xplat/jsx/dom */
import { ViewShot } from '../src/index'
import './layout.css'

export type LayoutMode = 'block' | 'flex' | 'grid' | 'style'

// No captureMode or capture call: this case measures the wrapper's layout only.
export function LayoutFixture(props: { mode: LayoutMode }) {
  return (
    <ViewShot
      id="layout-card"
      className={['layout-card', props.mode !== 'block' && `layout-${props.mode}`]}
      style={props.mode === 'style' ? { display: 'flex', flexDirection: 'row' } : undefined}
    >
      <div id="layout-first" className="layout-child" />
      <div id="layout-second" className="layout-child" />
    </ViewShot>
  )
}
