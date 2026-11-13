/** @jsxImportSource @octane-xplat/jsx/dom */
import { Drawer } from '@octane-xplat/ui'
import { useState } from 'octane'
import { Button, Text, TextInput } from '@octane-xplat/ui'
import { Chart } from '@octane-xplat/charts'
import { ImageCrop, type Crop } from '@octane-xplat/image-crop'
import { RollingText } from '@octane-xplat/rolling-text'
import {
  KeyboardProvider,
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from '@octane-xplat/keyboard'

import { SmoothCorners } from '@octane-xplat/smooth-corners'
import { MotionConfig, Presence, LayoutGroup, motion } from '@octane-xplat/motion'
import { DataGrid } from '@octane-xplat/table'
import { Image } from '@octane-xplat/image'
import { AnimatedImage } from '@octane-xplat/gif'
import { Video } from '@octane-xplat/video'
import { Pager } from '@octane-xplat/pager'
import { Icon } from '@octane-xplat/icons'

// Owned inline artwork keeps image examples independent of external image hosts.
const picture =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect width="240" height="160" fill="#2563eb"/><circle cx="120" cy="80" r="45" fill="#fff"/></svg>',
  )

const media = [
  {
    src: picture,
    alt: 'White circle on a blue field',
    width: 240,
    height: 160,
    caption: 'Local example artwork',
  },
  { src: picture, alt: 'Second local image', width: 240, height: 160 },
]

export function ChartExample() {
  return (
    <Chart
      type="bar"
      data={[
        {
          name: 'Fruit',
          values: [
            { x: 'Apricot', y: 5 },
            { x: 'Berry', y: 8 },
          ],
        },
      ]}
      width={360}
      height={240}
      accessibilityLabel="Fruit inventory"
    />
  )
}

export function ImageCropExample() {
  const [crop, setCrop] = useState<Crop>({ unit: '%', x: 10, y: 10, width: 70, height: 70 })

  return (
    <ImageCrop
      src={picture}
      alt="Crop local artwork"
      imageWidth={240}
      imageHeight={160}
      crop={crop}
      onChange={(_px, percent) => setCrop(percent)}
      width={360}
      height={240}
    />
  )
}

export function RollingTextExample() {
  const [value, setValue] = useState(12)

  return (
    <>
      <RollingText value={String(value)} />
      <Button label="Add one" onPress={() => setValue(value + 1)} />
    </>
  )
}

export function KeyboardExample() {
  return (
    <KeyboardProvider>
      <KeyboardAwareScrollView>
        <TextInput label="Message" />
        <KeyboardStickyView>
          <Button label="Send" />
        </KeyboardStickyView>
      </KeyboardAwareScrollView>
      <Text>Keyboard tracking applies on mobile. The browser retains the form layout.</Text>
    </KeyboardProvider>
  )
}

export function SmoothCornersExample() {
  return (
    <SmoothCorners corners={{ radius: 24 }}>
      <Text>Continuous corners</Text>
    </SmoothCorners>
  )
}

export function MotionExample() {
  const [visible, setVisible] = useState(false)

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <Button label="Toggle animated content" onPress={() => setVisible(!visible)} />
        <Presence present={visible}>
          {visible ? (
            <motion.View
              key="message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Text>Animated content</Text>
            </motion.View>
          ) : null}
        </Presence>
      </LayoutGroup>
    </MotionConfig>
  )
}

export function ImageExample() {
  return <Image src={picture} alt="Local artwork" style={{ width: 240, height: 160 }} />
}

export function IconExample() {
  return (
    <Icon
      icon={{
        body: '<path fill="currentColor" d="M4 12l5 5L20 6l-2-2-9 10-3-4z"/>',
        width: 24,
        height: 24,
      }}
      size={32}
    />
  )
}

export function DataGridExample() {
  return (
    <DataGrid
      data={[
        { name: 'Apricot', count: 5 },
        { name: 'Berry', count: 8 },
      ]}
      columns={[
        { accessorKey: 'name', header: 'Fruit' },
        { accessorKey: 'count', header: 'Count' },
      ]}
    />
  )
}

export function DrawerExample() {
  const [open, setOpen] = useState(false)

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      main={<Button label="Open drawer" onPress={() => setOpen(true)} />}
      drawer={
        <>
          <Text>Navigation panel</Text>
          <Button label="Close drawer" onPress={() => setOpen(false)} />
        </>
      }
    />
  )
}

export function PagerExample() {
  const [page, setPage] = useState(0)

  return (
    <>
      <Pager
        items={['First page', 'Second page']}
        renderItem={(item: string) => <Text>{item}</Text>}
        page={page}
        onPageChange={setPage}
        style={{ height: 180 }}
      />
      <Text>Selected page: {page + 1}</Text>
      <Button label="Next page" onPress={() => setPage((page + 1) % 2)} />
    </>
  )
}

export function AnimatedImageExample() {
  const [playing, setPlaying] = useState(false)

  return (
    <>
      <AnimatedImage
        src={
          playing
            ? 'data:image/gif;base64,R0lGODlhAgABAIAAACVj6////yH/C05FVFNDQVBFMi4wAwEAAAAh+QQAMgAAACwAAAAAAgABAAACAkQKACH5BAAyAAAALAAAAAACAAEAAAICDAoAOw=='
            : picture
        }
        alt="Two-color animation sample"
        width={160}
        height={80}
      />
      <Button
        label={playing ? 'Stop animation' : 'Play animation'}
        onPress={() => setPlaying(!playing)}
        isDisabled={window.matchMedia('(prefers-reduced-motion: reduce)').matches}
      />
    </>
  )
}

export function VideoExample() {
  const [playing, setPlaying] = useState(false)

  return (
    <>
      <Video
        src={new URL('../../../packages/video/tests/fixtures/clip.mp4', import.meta.url).href}
        playing={playing}
        muted={true}
        style={{ width: 320, height: 180 }}
        onPlayingChange={setPlaying}
      />
      <Button label={playing ? 'Pause' : 'Play local clip'} onPress={() => setPlaying(!playing)} />
    </>
  )
}
