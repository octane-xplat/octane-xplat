/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { act, createRoot } from 'octane'
import { Grid } from '../layout/Grid.web.tsrx'
import { Image } from './Image.web.tsrx'

const roots: any[] = []

function mount(props: any = {}) {
  const el = document.createElement('div')

  document.body.append(el)

  const root = createRoot(el)

  roots.push(root)
  act(() =>
    root.render(
      <Grid rows="*" columns="*">
        <Image src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==" alt="" {...props} />
      </Grid>,
    ),
  )

  return { root, img: el.querySelector('img') as HTMLImageElement }
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount())
  }

  document.body.innerHTML = ''
})

// Regression: layoutChildProps emitted the placement but the trailing
// `style={style}` prop replaced the whole style object (issue #179).
it('forwards row/col to the <img> grid placement', () => {
  const { img } = mount({ row: 0, col: 1 })

  expect(img.style.gridRow).toBe('1 / span 1')
  expect(img.style.gridColumn).toBe('2 / span 1')
})

it('forwards rowSpan/colSpan without explicit indices', () => {
  const { img } = mount({ rowSpan: 2, colSpan: 3 })

  expect(img.style.gridRow).toBe('span 2')
  expect(img.style.gridColumn).toBe('span 3')
})

it('keeps authored style and object-fit defaults alongside placement', () => {
  const { img } = mount({ row: 0, col: 0, style: { width: 24, height: 48 } })

  expect(img.style.gridRow).toBe('1 / span 1')
  expect(img.style.width).toBe('24px')
  expect(img.style.objectFit).toBe('cover')
})

it('forwards the remaining layout-child keys', () => {
  const { img } = mount({ flexGrow: 2, alignSelf: 'center', order: 1 })

  expect(img.style.flexGrow).toBe('2')
  expect(img.style.alignSelf).toBe('center')
  expect(img.style.order).toBe('1')
})
