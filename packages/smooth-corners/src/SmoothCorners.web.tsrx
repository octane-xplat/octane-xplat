/** @jsxImportSource @octane-xplat/jsx/dom */
import type { JSX } from 'octane/jsx-runtime'
import { useId, useLayoutEffect, useRef, useState } from 'octane'
import { innerLayoutProps, outerLayoutProps, paintedStyle } from './layout-child.web'
import { smoothPathD } from './path'
import { clipsChildren, contentPaintReset, surfaceLayout } from './surface'
import type { SmoothCornersProps } from './props'

/** Clip the painted surface independently; clip descendants only for hidden overflow. */
export function SmoothCorners(props: SmoothCornersProps): JSX.Element @{
  const shadowId = useId()
  const ref = useRef<HTMLDivElement | null>(null)
  const [box, setBox] = useState({ w: 0, h: 0, clip: false })

  const update = () => {
    const el = ref.current
    if (!el) {
      return
    }

    // Layout dimensions exclude transforms, so scale does not change the curve twice.
    const w = el.offsetWidth
    const h = el.offsetHeight
    const style = getComputedStyle(el)
    const clip = clipsChildren(style.overflowX, style.overflowY)
    setBox((prev) => (prev.w === w && prev.h === h && prev.clip === clip ? prev : { w, h, clip }))
  }

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }

    update()
    const resize = new ResizeObserver(update)
    resize.observe(el)
    // Ancestor classes can change the selected overflow rule as well.
    const mutations = new MutationObserver(update)
    for (let node: Element | null = el; node; node = node.parentElement) {
      mutations.observe(node, { attributes: true, attributeFilter: ['class', 'style'] })
    }

    window.addEventListener('resize', update)
    return () => {
      resize.disconnect()
      mutations.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  useLayoutEffect(update, null)

  const d = smoothPathD(box.w, box.h, props.corners)
  const path = box.w > 0 && box.h > 0 ? `path("${d}")` : undefined
  const shadow = props.shadow
  const shadowPadding = Math.max(
    1,
    (shadow?.blur ?? 0) * 4 + Math.abs(shadow?.offsetX ?? 0) + Math.abs(shadow?.offsetY ?? 0),
  )

  return (
    <div style={{ display: 'grid', position: 'relative', ...outerLayoutProps(props).style }}>
      {shadow && box.w > 0 && box.h > 0 && (
        <svg
          aria-hidden="true"
          style={{ ...surfaceLayout, pointerEvents: 'none', overflow: 'visible' }}
        >
          <defs>
            <filter
              id={shadowId}
              filterUnits="userSpaceOnUse"
              x={-shadowPadding}
              y={-shadowPadding}
              width={box.w + shadowPadding * 2}
              height={box.h + shadowPadding * 2}
            >
              <feGaussianBlur in="SourceAlpha" stdDeviation={shadow.blur ?? 0} />
              <feOffset dx={shadow.offsetX ?? 0} dy={shadow.offsetY ?? 0} result="offset" />
              <feFlood
                floodColor={shadow.color ?? '#000000'}
                floodOpacity={shadow.opacity ?? 0.35}
              />
              <feComposite in2="offset" operator="in" />
            </filter>
          </defs>
          <path d={d} filter={`url(#${shadowId})`} />
        </svg>
      )}
      <div
        ref={ref}
        id={props.id}
        className={['vx-smooth-corners', props.className]}
        style={{
          position: 'relative',
          ...paintedStyle(props.style),
          ...innerLayoutProps(props).style,
          ...contentPaintReset,
          clipPath: box.clip ? path : undefined,
        }}
      >
        <div aria-hidden="true" style={{ ...surfaceLayout, pointerEvents: 'none' }}>
          <div
            className={props.className}
            style={{
              ...paintedStyle(props.style),
              ...surfaceLayout,
              boxSizing: 'border-box',
              clipPath: path,
            }}
          >
            {props.border && box.w > 0 && (
              <svg
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                viewBox={`0 0 ${box.w} ${box.h}`}
                preserveAspectRatio="none"
              >
                <path
                  d={d}
                  fill="none"
                  stroke={props.border.color}
                  strokeWidth={props.border.width * 2}
                />
              </svg>
            )}
          </div>
        </div>
        {props.children}
      </div>
    </div>
  )
}
