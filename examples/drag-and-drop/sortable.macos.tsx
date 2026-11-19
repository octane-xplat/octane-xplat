/** @jsxImportSource @octane-xplat/jsx */
import 'octane/signals'
import { useCallback, useRef, useState } from 'octane'
import { Text, View, useMeasure$ } from '@octane-xplat/ui'
import { SortableList } from '@octane-xplat/dnd-kit'

/** AppKit scroll ownership stays explicit; all geometry and offsets use top-down points. */
export default function SortableExample(): unknown {
  // 1. Own the item order, scroll position, and measured viewport.
  const [items, setItems] = useState(Array.from({ length: 20 }, (_, index) => `task-${index + 1}`))
  const scrollRef = useRef<any>(null)
  const offsetRef = useRef(0)
  const initialized = useRef(false)
  const measure = useMeasure$()
  const measuredBounds = measure.bounds$.get()
  const bindScroll = useCallback(
    (view: any) => {
      scrollRef.current = view
      measure.ref(view?.contentView ?? null)
    },
    [measure.ref],
  )

  // 2. Convert AppKit's scroll coordinates to a top-down offset.
  const top = () => {
    const scroll = scrollRef.current
    const clip = scroll?.contentView
    const content = scroll?.documentView

    if (!clip || !content) {
      return 0
    }

    const flipped =
      typeof content.isFlipped === 'function' ? content.isFlipped() : content.isFlipped

    return flipped
      ? Number(clip.bounds.origin.y)
      : Number(content.frame.size.height) -
          Number(clip.bounds.size.height) -
          Number(clip.bounds.origin.y)
  }

  // 3. Render a scroll view that measures and initializes its content.
  return (
    <View>
      <Text id="dnd-order">{items.join(',')}</Text>
      <scrollview
        id="dnd-scroll"
        style={{ height: 240 }}
        ref={bindScroll}
        onScroll={() => {
          offsetRef.current = top()
        }}
      >
        <masonview
          onLayoutChanged={() => {
            const scroll = scrollRef.current

            if (
              initialized.current ||
              !scroll?.window ||
              scroll.documentView.frame.size.height <= scroll.contentView.bounds.size.height
            ) {
              return
            }

            initialized.current = true

            const content = scroll.documentView
            const flipped =
              typeof content.isFlipped === 'function' ? content.isFlipped() : content.isFlipped

            scroll.contentView.scrollToPoint({
              x: 0,
              y: flipped
                ? 0
                : Math.max(0, content.frame.size.height - scroll.contentView.bounds.size.height),
            })

            scroll.reflectScrolledClipView(scroll.contentView)
            measure.ref(scroll.contentView)
            offsetRef.current = top()
          }}
          style={{
            flexDirection: 'column',
            display: 'flex',
          }}
        >
          {/* 4. Supply scroll bounds and a scroll operation to the sortable list. */}
          <SortableList
            items={items}
            onReorder={setItems}
            dnd={{
              autoScroll: {
                bounds: () => measuredBounds,
                offsetRef,
                maxOffset: () => {
                  const scroll = scrollRef.current

                  return Math.max(
                    0,
                    Number(scroll?.documentView?.frame?.size?.height ?? 0) -
                      Number(scroll?.contentView?.bounds?.size?.height ?? 0),
                  )
                },
                scrollTo: (offset) => {
                  const scroll = scrollRef.current
                  const content = scroll.documentView
                  const clip = scroll.contentView
                  const flipped =
                    typeof content.isFlipped === 'function'
                      ? content.isFlipped()
                      : content.isFlipped

                  const y = flipped
                    ? offset
                    : Math.max(
                        0,
                        Number(content.frame.size.height) -
                          Number(clip.bounds.size.height) -
                          offset,
                      )

                  clip.scrollToPoint({ x: Number(clip.bounds.origin.x), y })
                  scroll.reflectScrolledClipView(clip)
                  offsetRef.current = top()
                },
              },
            }}
            renderItem={(id) => (
              <View id={`dnd-${id}`} style={{ height: 64, padding: 12 }}>
                <Text>{id}</Text>
              </View>
            )}
          />
        </masonview>
      </scrollview>
    </View>
  )
}
