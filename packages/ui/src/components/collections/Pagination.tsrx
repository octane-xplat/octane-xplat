/** @jsxImportSource @octane-xplat/jsx */
import { useDirection, useTranslator } from '../../internal/platform/internationalization'
import { mergeStyle } from '../../internal/layout/style-merge'
import type { PaginationProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'

/** Pagination — ‹ › plus a windowed run of page buttons around `page`
 *  (first, last, `siblingCount` each side, … for gaps). */
export function Pagination(props: PaginationProps): unknown @{
  const direction = useDirection()
  const translate = useTranslator()
  const sibling = props.siblingCount ?? 1
  const count = Math.max(0, props.pageCount)
  const current = Math.min(Math.max(1, props.page), Math.max(1, count))

  const pages: { key: string; page: number | null }[] = []
  let lastEllipsis = false

  for (let p = 1; p <= count; p++) {
    if (p === 1 || p === count || Math.abs(p - current) <= sibling) {
      pages.push({ key: String(p), page: p })
      lastEllipsis = false
    } else if (!lastEllipsis) {
      pages.push({ key: 'e' + p, page: null })
      lastEllipsis = true
    }
  }

  const go = (p: number) => {
    if (props.disabled || p < 1 || p > count || p === current) {
      return
    }

    props.onPageChange?.(p)
  }

  <masonview
    ref={(v: any) => void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))}
    id={props.id}
    className={['vx-pagination', props.disabled && 'vx-pagination--disabled', props.className]}
    style={mergeStyle({ display: 'flex' }, props.style)}
  >
    <masonview
      className="vx-page-btn"
      accessibilityLabel={translate('@astryx.pagination.previous')}
      onTap={() => go(current - 1)}
      style={{ display: 'flex' }}
    >
      <label text={direction === 'rtl' ? '›' : '‹'} />
    </masonview>
    @for (const e of pages; key e.key) {
      @if (e.page == null) {
        <label className="vx-page-ellipsis" text="…" />
      } @else {
        <masonview
          className={['vx-page-btn', e.page === current && 'vx-page-btn--on']}
          onTap={() => go(e.page!)}
          style={{ display: 'flex' }}
        >
          <label text={String(e.page)} />
        </masonview>
      }
    }
    <masonview
      className="vx-page-btn"
      accessibilityLabel={translate('@astryx.pagination.next')}
      onTap={() => go(current + 1)}
      style={{ display: 'flex' }}
    >
      <label text={direction === 'rtl' ? '‹' : '›'} />
    </masonview>
  </masonview>
}
