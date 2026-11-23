import { useIntersectionObserver } from '@octane-xplat/intersection-observer'
import { ScrollableArea, Text, View, VStack } from '@octane-xplat/ui'

export function VisibleRow() {
  // 1. Observe the target when at least half of it is inside the scroll area.
  const { ref, rootRef, entry, isIntersecting } = useIntersectionObserver({
    threshold: 0.5,
  })

  // 2. Show the latest state outside the scrolling region.
  return (
    <View>
      <Text>{isIntersecting ? 'Visible' : 'Outside viewport'}</Text>
      <Text>{entry?.intersectionRatio ?? 0}</Text>
      {/* 3. Attach the root and target refs, then scroll to reveal the target. */}
      <ScrollableArea ref={rootRef} height={160}>
        <VStack height={220}>
          <Text>Scroll down to find the watched item.</Text>
        </VStack>
        <View ref={ref}>
          <Text>Watched item</Text>
        </View>
        <VStack height={220} />
      </ScrollableArea>
    </View>
  )
}
