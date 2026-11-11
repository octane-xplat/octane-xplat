/** @jsxImportSource @octane-xplat/jsx */
// The same theme and application stylesheet are loaded on every target.
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import '@octane-xplat/ui/theme/utilities.css'
import './page.css'
import { SafeArea, ScrollableArea, VStack, HStack, Text, Button } from '@octane-xplat/ui'
import type { ScrollableAreaHandle, ScrollAxis } from '@octane-xplat/ui'
import type { ProbeContext } from '../../../../../tools/probe/context'

let scroll: ScrollableAreaHandle | null = null
const capture = (handle: ScrollableAreaHandle | null) => {
  scroll = handle
}

const paragraph =
  'Ordinary shared page content should wrap inside the available screen width without custom width declarations on every card and paragraph.'

export default function Page(props: { width?: number; refreshable?: boolean }) {
  return (
    <VStack id="host" width={props.width ?? 375} height={600}>
      <SafeArea id="page">
        <ScrollableArea
          id="scroll"
          ref={capture}
          refreshing={props.refreshable ? false : undefined}
        >
          <VStack id="content" className="page-content">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <VStack key={i} id={`card-${i}`} className="page-card">
                <Text id={`text-${i}`}>{paragraph}</Text>
                <HStack id={`controls-${i}`} wrap="wrap" gap={2}>
                  <Button id={`first-${i}`} onPress={() => {}}>
                    First control
                  </Button>
                  <Button id={`second-${i}`} onPress={() => {}}>
                    Second control
                  </Button>
                  <Button id={`third-${i}`} onPress={() => {}}>
                    Third control
                  </Button>
                </HStack>
              </VStack>
            ))}
          </VStack>
        </ScrollableArea>
      </SafeArea>
    </VStack>
  )
}

function Intrinsic(props: { axis: ScrollAxis }) {
  return (
    <VStack id="host" width={320} height={240}>
      <SafeArea id="page">
        <ScrollableArea id="scroll" ref={capture} axis={props.axis} height={180}>
          <VStack id="wide" width={640} height={480}>
            <Text>Intentionally wider content</Text>
          </VStack>
        </ScrollableArea>
      </SafeArea>
    </VStack>
  )
}

function NaturalWidth() {
  return (
    <VStack id="host" width={320} height={240}>
      <SafeArea>
        <ScrollableArea id="scroll" ref={capture} axis="inline" height={120}>
          <HStack>
            <VStack id="natural-first" width={260}>
              <Text>First panel</Text>
            </VStack>
            <VStack width={260}>
              <Text>Second panel</Text>
            </VStack>
            <VStack id="natural-last" width={260}>
              <Text>Third panel</Text>
            </VStack>
          </HStack>
        </ScrollableArea>
      </SafeArea>
    </VStack>
  )
}

function ShortPage() {
  return (
    <VStack id="host" width={320} height={600}>
      <SafeArea id="page">
        <ScrollableArea id="scroll">
          <Text id="short">Short notes</Text>
        </ScrollableArea>
      </SafeArea>
    </VStack>
  )
}

function SafeAreaMode(props: { mode: 'block' | 'class' | 'style' }) {
  return (
    <VStack width={320} height={240}>
      <SafeArea
        edges={[]}
        className={props.mode === 'class' ? 'page-safe-flex' : undefined}
        style={props.mode === 'style' ? { display: 'flex', flexDirection: 'row' } : undefined}
      >
        <VStack id="mode-first" width={120} height={40}>
          <Text>First</Text>
        </VStack>
        <VStack id="mode-second" width={120} height={40}>
          <Text>Second</Text>
        </VStack>
      </SafeArea>
    </VStack>
  )
}

function frame(ctx: ProbeContext, id: string) {
  const box = ctx.inspect(id).frame

  if (!box) {
    throw new Error(`No layout for ${id}`)
  }

  return box
}

async function checkPage(ctx: ProbeContext, width: number, refreshable: boolean) {
  await ctx.mount(Page, { width, refreshable })
  await ctx.waitFor(() => (ctx.inspect('text-0').frame?.height ?? 0) > 0)

  const host = frame(ctx, 'host')
  const ids = [
    'page',
    'scroll',
    'content',
    ...[0, 1, 2, 3, 4, 5].flatMap((i) => [
      `card-${i}`,
      `text-${i}`,
      `controls-${i}`,
      `first-${i}`,
      `second-${i}`,
      `third-${i}`,
    ]),
  ]

  ctx.record(
    `page ${width} refresh=${refreshable}`,
    ids.map((id) => ({ id, ...frame(ctx, id) })),
  )

  for (const id of ids) {
    const box = frame(ctx, id)

    ctx.assert(`${id} left within ${width}`, box.x >= host.x - 1)
    ctx.assert(`${id} right within ${width}`, box.x + box.width <= host.x + width + 1)
    ctx.assert(`${id} positive width`, box.width > 0)
  }

  ctx.assert('card uses available width', Math.abs(frame(ctx, 'card-0').width - (width - 48)) <= 1)
  ctx.assert('paragraph wraps', frame(ctx, 'text-0').height > 40)
  ctx.assert('controls wrap to another row', frame(ctx, 'third-0').y > frame(ctx, 'first-0').y)
  for (const id of ['page', 'scroll']) {
    const box = frame(ctx, id)

    ctx.assert(
      `${id} height bounded`,
      box.height > 0 && box.y + box.height <= host.y + host.height + 1,
    )
  }

  const viewport = frame(ctx, 'scroll')

  ctx.assert('content taller than viewport', frame(ctx, 'content').height > viewport.height)

  const before = frame(ctx, 'card-0').y

  scroll!.scrollToOffset({ block: 80 })
  await ctx.waitFor(() => frame(ctx, 'card-0').y < before - 20)
  ctx.record(`scroll ${width} refresh=${refreshable}`, {
    before,
    after: frame(ctx, 'card-0').y,
    viewport,
  })

  scroll!.scrollToOffset({ block: 0 })
  await ctx.waitFor(() => Math.abs(frame(ctx, 'card-0').y - before) <= 1)
  return viewport
}

export async function run(ctx: ProbeContext) {
  for (const mode of ['block', 'class', 'style'] as const) {
    await ctx.mount(SafeAreaMode, { mode })
    await ctx.waitFor(() => (ctx.inspect('mode-second').frame?.height ?? 0) > 0)

    const first = frame(ctx, 'mode-first')
    const second = frame(ctx, 'mode-second')

    ctx.record(`SafeArea ${mode}`, { first, second })
    ctx.assert(`${mode} first width preserved`, Math.abs(first.width - 120) <= 1)
    if (mode === 'block') {
      ctx.assert('block children flow vertically', second.y >= first.y + first.height - 1)
      ctx.assert('block children share left edge', Math.abs(second.x - first.x) <= 1)
    } else {
      ctx.assert(`${mode} flex override flows horizontally`, second.x >= first.x + first.width - 1)
      ctx.assert(`${mode} flex children share top edge`, Math.abs(second.y - first.y) <= 1)
    }
  }

  let normalHeight = 0

  for (const width of [320, 375, 428]) {
    const viewport = await checkPage(ctx, width, false)

    if (width === 375) {
      normalHeight = viewport.height
    }
  }

  const refreshed = await checkPage(ctx, 375, true)

  ctx.assert(
    'refresh indicator overlays without taking viewport height',
    Math.abs(refreshed.height - normalHeight) <= 1,
  )

  for (const axis of ['inline', 'both'] as const) {
    await ctx.mount(Intrinsic, { axis })
    await ctx.waitFor(() => (ctx.inspect('wide').frame?.width ?? 0) > 0)
    ctx.assert(`${axis} explicit width preserved`, Math.abs(frame(ctx, 'wide').width - 640) <= 1)
    ctx.assert(`${axis} viewport fits`, frame(ctx, 'scroll').width <= 321)

    const before = frame(ctx, 'wide')

    scroll!.scrollToOffset({ inline: 80, ...(axis === 'both' ? { block: 80 } : {}) })
    await ctx.waitFor(() => frame(ctx, 'wide').x < before.x - 20)
    if (axis === 'both') {
      await ctx.waitFor(() => frame(ctx, 'wide').y < before.y - 20)
    }

    ctx.record(`${axis} scrolled`, {
      before,
      after: frame(ctx, 'wide'),
      viewport: frame(ctx, 'scroll'),
    })
  }

  await ctx.mount(NaturalWidth)
  await ctx.waitFor(() => (ctx.inspect('natural-last').frame?.width ?? 0) > 0)
  ctx.assert(
    'intrinsic panels retain width',
    Math.abs(frame(ctx, 'natural-first').width - 260) <= 1,
  )

  ctx.assert(
    'intrinsic row extends beyond viewport',
    frame(ctx, 'natural-last').x > frame(ctx, 'scroll').x + 320,
  )

  const before = frame(ctx, 'natural-first').x

  scroll!.scrollToOffset({ inline: 100 })
  await ctx.waitFor(() => frame(ctx, 'natural-first').x < before - 20)
  ctx.record('intrinsic row scroll', { before, after: frame(ctx, 'natural-first').x })

  await ctx.mount(ShortPage)
  await ctx.waitFor(() => (ctx.inspect('short').frame?.height ?? 0) > 0)
  ctx.assert('short page retains content height', frame(ctx, 'page').height < 300)
  ctx.assert('short viewport retains content height', frame(ctx, 'scroll').height < 100)
}
