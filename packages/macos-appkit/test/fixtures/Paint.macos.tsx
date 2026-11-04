/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

// Embedded pixel is decoded only to exercise image-resource lifetime, never
// inspected for appearance. Geometry assertions do not establish visual parity.
const pixel =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jG3sAAAAASUVORK5CYII='
export default function Paint() {
  const phase$ = useSignal$(0)
  const phase = phase$.get()
  const active = phase < 4
  const size = { width: phase === 0 ? 120 : 200, height: phase === 0 ? 80 : 100 }
  return (
    <masonview style={{ display: 'flex', flexDirection: 'column' }}>
      <masonview
        id="paint-percent"
        style={{
          ...size,
          ...(active
            ? {
                borderRadius: '50%',
                translateX: '25%',
                outline: '2px dashed red',
                outlineOffset: 1,
              }
            : {}),
        }}
      />
      <masonview
        id="paint-bands"
        style={{
          ...size,
          ...(active
            ? {
                borderTopWidth: 6,
                borderRightWidth: 3,
                borderColor: 'red',
                borderStyle: 'double',
                borderTopLeftRadius: 8,
                borderBottomRightRadius: '25%',
              }
            : {}),
        }}
      />
      <masonview
        id="paint-shadows"
        style={{
          ...size,
          ...(active
            ? {
                borderRadius: 20,
                boxShadow: '0 4px 12px black, 2px 3px 5px blue, inset 1px 2px 3px red',
              }
            : {}),
        }}
      />
      <masonview
        id="paint-backgrounds"
        style={{
          ...size,
          ...(active ? { backgroundImage: `url(${pixel}), linear-gradient(red, blue)` } : {}),
        }}
      />
      <masonview id="paint-point" style={{ ...size, ...(active ? { translateX: 10 } : {}) }} />
      <masonview
        id="advance-paint"
        onTap={() => phase$.set(phase + 1)}
        style={{ width: 20, height: 20 }}
      />
    </masonview>
  )
}
