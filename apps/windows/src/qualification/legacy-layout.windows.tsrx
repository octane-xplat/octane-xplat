/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef } from 'octane'
import { FlexboxLayout, Label, LayoutBase, StackLayout } from '@nativescript/core'

type LegacyState = {
  box: FlexboxLayout
  row: FlexboxLayout
  labels: Label[]
  destination: StackLayout
}

/** NativeScript layout regression, separate from Mason. The shrink case
 * requires the matching preferred-size Core patch and Widgets pair. */
export function LegacyLayout(props: { revision: number }): unknown @{
  const container = useRef<LayoutBase | null>(null)
  const state = useRef<LegacyState | null>(null)

  useEffect(() => {
    const target = container.current

    if (!target) {
      return
    }

    // The shared JSX facade deliberately excludes legacy layout tags.
    // Construct them through NativeScript only inside this binary probe.
    const stack = new StackLayout()

    stack.id = 'core20-legacy'
    stack.width = 240

    let padded: FlexboxLayout | undefined

    for (const name of ['fixed', 'auto', 'empty']) {
      const box = new FlexboxLayout()

      box.id = `core20-legacy-${name}`
      box.width = 200
      box.flexDirection = 'column'
      box.paddingLeft = 17
      box.paddingTop = 7
      box.paddingRight = 13
      box.paddingBottom = 11
      if (name === 'fixed') {
        box.height = 60
        padded = box
      }

      if (name !== 'empty') {
        const label = new Label()

        label.id = `core20-legacy-${name}-child`
        label.text = `${name} padding child`
        label.height = 10
        box.addChild(label)
      }

      stack.addChild(box)
    }

    const row = new FlexboxLayout()

    row.id = 'core20-auto-row'
    row.width = 170
    row.height = 30
    row.flexDirection = 'row'
    row.padding = 0

    const labels = [0, 1].map((index) => {
      const label = new Label()

      label.id = `core20-auto-child-${index}`
      label.text = index ? 'B' : 'A'
      label.width = 100
      label.height = 10
      FlexboxLayout.setFlexShrink(label, 1)
      row.addChild(label)
      return label
    })

    const destination = new StackLayout()

    destination.id = 'core20-auto-destination'
    destination.width = 170
    destination.height = 30
    stack.addChild(row)
    stack.addChild(destination)
    if (!padded) {
      throw new Error('Missing fixed padding fixture')
    }

    state.current = { box: padded, row, labels, destination }
    target.addChild(stack)
    return () => {
      state.current = null
      for (const label of labels) {
        if (label.parent === row) {
          row.removeChild(label)
        } else if (label.parent === destination) {
          destination.removeChild(label)
        }
      }

      if (stack.parent === target) {
        target.removeChild(stack)
      }
    }
  }, [])

  useEffect(() => {
    if (!state.current) {
      return
    }

    const { box, row, labels, destination } = state.current
    const [first, second] = labels
    const revision = props.revision

    box.width = revision ? 220 : 200
    box.paddingLeft = revision ? 23 : 17
    box.paddingTop = revision ? 9 : 7
    if (revision === 0 || revision === 3) {
      row.width = 170
      row.height = 30
      row.flexDirection = 'row'
      for (const label of labels) {
        label.width = 100
        label.height = 10
      }
    } else if (revision === 1) {
      row.width = 220
      first.width = 120
      second.width = 100
    } else if (revision === 2) {
      row.flexDirection = 'column'
      row.width = 30
      row.height = 170
      for (const label of labels) {
        label.width = 10
        label.height = 100
      }
    } else if (revision === 4 && first.parent === row) {
      row.removeChild(first)
      destination.addChild(first)
    } else if (revision === 5) {
      first.width = 90
    } else if (revision === 6 && first.parent === destination) {
      destination.removeChild(first)
      first.width = 100
      row.addChild(first)
    } else if (revision === 7) {
      first.width = 'auto'
    }
  }, [props.revision])

  <masonview
    id="core20-legacy-host"
    className="core20-legacy-host"
    ref={container}
    style={{ display: 'flex' }}
  />
}
