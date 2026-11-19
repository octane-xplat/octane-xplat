import { useState } from 'octane'
import { HoverCard, Carousel, Lightbox, Button, Text } from '@octane-xplat/ui'

// 1. Give the image a meaningful description and use an app-owned image URL.
const media = [{ src: 'https://example.com/trip.jpg', alt: 'A mountain lake on our trip' }]

export function TripPreview() {
  // 2. Keep the lightbox open state in the owning screen.
  const [open, setOpen] = useState(false)
  // 3. Reveal details on hover and open the image from a carousel action.
  return (
    <>
      <HoverCard content={<Text>Saved yesterday</Text>}>
        <Text>Autumn trip</Text>
      </HoverCard>
      <Carousel label="Trip previews" hasButtons>
        <Button onPress={() => setOpen(true)}>View trip photo</Button>
      </Carousel>
      <Lightbox isOpen={open} onOpenChange={setOpen} media={media} />
    </>
  )
}
