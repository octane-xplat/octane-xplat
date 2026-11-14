/** @jsxImportSource @octane-xplat/jsx */
import '@octane-xplat/ui/theme/tokens.css'
import './content-flow.css'
import {
  Alert,
  Banner,
  Blockquote,
  Card,
  Carousel,
  ClickableCard,
  Collapsible,
  ContextMenu,
  Dialog,
  HoverCard,
  Item,
  KeyboardAvoiding,
  List,
  ListItem,
  MetadataList,
  MetadataListItem,
  Screen,
  Section,
  SelectableCard,
  Step,
  Toast,
  VirtualList,
  VStack,
  View,
  useHoverCard,
  useLayer,
} from '@octane-xplat/ui'

import { useState } from 'octane'
import type { ProbeContext } from '../../../../../tools/probe/context'
import { ChatMessageBubble } from '@octane-xplat/ui/chat'

type Kind =
  | 'Alert'
  | 'Banner'
  | 'Blockquote'
  | 'Item.Content'
  | 'ListItem body'
  | 'MetadataListItem value'
  | 'HoverCard content'
  | 'useHoverCard content'
  | 'useLayer context'
  | 'useLayer custom'
  | 'useLayer fixed'
  | 'Carousel slide'
  | 'Step content'
  | 'Toast body'
  | 'Card slots'
  | 'ClickableCard'
  | 'SelectableCard'
  | 'Section'
  | 'Dialog'
  | 'Collapsible'
  | 'ContextMenu'
  | 'ChatMessageBubble'
  | 'KeyboardAvoiding'
  | 'VirtualList'
  | 'VirtualList empty'

const items = [{ id: 'row' }, { id: 'tail' }]
let resize: ((width: number) => void) | undefined
let toggleDialog: ((open: boolean) => void) | undefined

function Children(props: { prefix?: string }) {
  const prefix = props.prefix ?? 'body'

  return (
    <>
      <View id={`${prefix}-first`} className="content-flow-child" flexGrow={1} />
      <View id={`${prefix}-second`} className="content-flow-child" flexGrow={1} />
    </>
  )
}

function HoverCardContent() {
  const card = useHoverCard({ isOpen: true })

  return (
    <>
      <View ref={card.ref} className="content-flow-trigger" />
      {card.renderHoverCard(<Children />, {
        className: 'content-flow-host content-flow-hovercard',
      })}
    </>
  )
}

function FixedLayerContent() {
  const layer = useLayer({ mode: 'fixed', isOpen: true })

  return layer.render(<Children />, { className: 'content-flow-host', x: 0, y: 0 })
}

function AnchoredLayerContent(props: { custom: boolean }) {
  const layer = useLayer({ mode: 'context', isOpen: true })

  return (
    <>
      <View ref={layer.ref} className="content-flow-trigger" />
      {layer.render(
        <Children />,
        props.custom
          ? { className: 'content-flow-host', positioning: 'custom', style: { left: 0, top: 0 } }
          : { className: 'content-flow-host' },
      )}
    </>
  )
}

export default function Example(props: { kind: Kind }) {
  const [width, setWidth] = useState(240)
  const [open, setOpen] = useState(true)

  resize = setWidth
  toggleDialog = setOpen

  const content = <Children />

  const panel = (
    <VStack width={320} height={400}>
      {props.kind === 'Alert' ? (
        <Alert className="content-flow-host content-flow-notice">{content}</Alert>
      ) : props.kind === 'Banner' ? (
        <Banner icon={false} collapsible={false} className="content-flow-host content-flow-notice">
          {content}
        </Banner>
      ) : props.kind === 'Blockquote' ? (
        <Blockquote
          className="content-flow-host"
          cite={<View id="body-cite" className="content-flow-child" />}
        >
          {content}
        </Blockquote>
      ) : props.kind === 'Item.Content' ? (
        <Item className="content-flow-host content-flow-row">
          <Item.Content>{content}</Item.Content>
        </Item>
      ) : props.kind === 'ListItem body' ? (
        <List className="content-flow-host">
          <ListItem label={null} className="content-flow-host content-flow-row">
            {content}
          </ListItem>
        </List>
      ) : props.kind === 'MetadataListItem value' ? (
        <MetadataList
          className="content-flow-host content-flow-metadata"
          label={{ position: 'top' }}
        >
          <MetadataListItem label="Value">{content}</MetadataListItem>
        </MetadataList>
      ) : props.kind === 'HoverCard content' ? (
        <HoverCard isOpen className="content-flow-host content-flow-hovercard" content={content}>
          <View className="content-flow-trigger" />
        </HoverCard>
      ) : props.kind === 'useHoverCard content' ? (
        <HoverCardContent />
      ) : props.kind === 'useLayer fixed' ? (
        <FixedLayerContent />
      ) : props.kind === 'useLayer context' || props.kind === 'useLayer custom' ? (
        <AnchoredLayerContent custom={props.kind === 'useLayer custom'} />
      ) : props.kind === 'Carousel slide' ? (
        <Carousel className="content-flow-host content-flow-carousel" gap={0}>
          {content}
        </Carousel>
      ) : props.kind === 'Step content' ? (
        <Step step={0} indicator="none" className="content-flow-host content-flow-step">
          {content}
        </Step>
      ) : props.kind === 'Toast body' ? (
        <Toast className="content-flow-host content-flow-toast" isAutoHide={false} body={content} />
      ) : props.kind === 'Card slots' ? (
        <Card
          className="content-flow-card"
          padding={0}
          header={<Children prefix="header" />}
          footer={<Children prefix="footer" />}
        >
          {content}
        </Card>
      ) : props.kind === 'ClickableCard' ? (
        <ClickableCard
          label="Content flow"
          className="content-flow-host"
          padding={0}
          onPress={() => {}}
        >
          {content}
        </ClickableCard>
      ) : props.kind === 'SelectableCard' ? (
        <SelectableCard
          label="Content flow"
          className="content-flow-host"
          padding={0}
          isSelected={false}
          onChange={() => {}}
        >
          {content}
        </SelectableCard>
      ) : props.kind === 'Section' ? (
        <Section className="content-flow-host" padding={0}>
          {content}
        </Section>
      ) : props.kind === 'Dialog' ? (
        <Dialog isInline isOpen={open} padding={0} width={240} className="content-flow-host">
          {content}
        </Dialog>
      ) : props.kind === 'Collapsible' ? (
        <Collapsible
          open
          trigger={<View className="content-flow-trigger" />}
          className="content-flow-host"
        >
          {content}
        </Collapsible>
      ) : props.kind === 'ContextMenu' ? (
        <ContextMenu items={[]} className="content-flow-host">
          {content}
        </ContextMenu>
      ) : props.kind === 'ChatMessageBubble' ? (
        <ChatMessageBubble className="content-flow-host">{content}</ChatMessageBubble>
      ) : props.kind === 'VirtualList' ? (
        <VirtualList
          id="content-flow-viewport"
          style={{ width }}
          className="content-flow-host"
          items={items}
          renderItem={(_item, index) => <Children prefix={index === 0 ? 'body' : 'tail'} />}
          renderHeader={() => <Children prefix="header" />}
          renderFooter={() => <Children prefix="footer" />}
          renderSeparator={() => <Children prefix="separator" />}
        />
      ) : props.kind === 'VirtualList empty' ? (
        <VirtualList
          id="content-flow-viewport"
          style={{ width }}
          className="content-flow-host"
          items={[]}
          renderItem={() => null}
          renderEmpty={() => content}
        />
      ) : (
        <KeyboardAvoiding enabled={false} className="content-flow-host">
          {content}
        </KeyboardAvoiding>
      )}
    </VStack>
  )

  // Native anchored layers use the enclosing Screen's RootLayout outlet.
  return props.kind.includes('HoverCard') || props.kind.startsWith('useLayer') ? (
    <Screen>{panel}</Screen>
  ) : (
    panel
  )
}

export async function run(ctx: ProbeContext) {
  for (const kind of [
    'Alert',
    'Banner',
    'Blockquote',
    'Item.Content',
    'ListItem body',
    'MetadataListItem value',
    'HoverCard content',
    'useHoverCard content',
    'useLayer context',
    'useLayer custom',
    'useLayer fixed',
    'Carousel slide',
    'Step content',
    'Toast body',
    'Card slots',
    'ClickableCard',
    'SelectableCard',
    'Section',
    'Dialog',
    'Collapsible',
    'ContextMenu',
    'ChatMessageBubble',
    'KeyboardAvoiding',
    'VirtualList',
    'VirtualList empty',
  ] as const) {
    await ctx.mount(Example, { kind })
    if (kind.startsWith('VirtualList')) {
      ctx.record(`${kind} viewport`, ctx.inspect('content-flow-viewport'))
    }

    const prefixes =
      kind === 'Card slots'
        ? ['header', 'body', 'footer']
        : kind === 'VirtualList'
          ? ['header', 'body', 'separator', 'footer']
          : ['body']

    for (const prefix of prefixes) {
      await ctx.waitFor(
        () => {
          if (!ctx.find(`${prefix}-second`)) {
            return false
          }

          const second = ctx.inspect(`${prefix}-second`)

          if (kind.includes('HoverCard')) {
            ctx.record(`${kind} pending frame`, second)
          }

          return (second.frame?.width ?? 0) > 0
        },
        {
          timeout: 5000,
        },
      )

      const first = ctx.inspect(`${prefix}-first`).frame!
      const second = ctx.inspect(`${prefix}-second`).frame!
      const advance = ctx.target === 'macos' ? first.y - second.y : second.y - first.y

      ctx.record(`${kind} ${prefix}`, { first, second })
      ctx.assert(`${kind} ${prefix} fills available width`, Math.abs(first.width - 240) <= 1)
      ctx.assert(`${kind} ${prefix} ignores flex growth`, Math.abs(first.height - 20) <= 1)
      ctx.assert(`${kind} ${prefix} flows vertically`, Math.abs(advance - 20) <= 1)
      ctx.assert(`${kind} ${prefix} shares left edge`, Math.abs(first.x - second.x) <= 1)
    }

    if (kind === 'Blockquote') {
      const body = ctx.inspect('body-second').frame!
      const cite = ctx.inspect('body-cite').frame!
      const advance = ctx.target === 'macos' ? body.y - cite.y : cite.y - body.y

      ctx.assert('blockquote citation follows quoted content', Math.abs(advance - 20) <= 1)
    }

    if (kind === 'Dialog') {
      await ctx.waitFor(() => toggleDialog)
      toggleDialog!(false)
      await ctx.waitFor(() => !ctx.find('body-first'))
      ctx.assert('inline dialog closes without a modal host', !ctx.find('body-first'))
      toggleDialog!(true)
      await ctx.waitFor(
        () => ctx.find('body-first') && (ctx.inspect('body-first').frame?.width ?? 0) > 0,
      )

      ctx.assert(
        'inline dialog reopens in place',
        Math.abs(ctx.inspect('body-first').frame!.width - 240) <= 1,
      )
    }

    if (kind.startsWith('VirtualList')) {
      await ctx.waitFor(() => resize)

      const original = ctx.find('body-first')

      for (const width of [180, 240]) {
        resize!(width)
        await ctx.waitFor(
          () => {
            const content = ctx.inspect('body-first')

            ctx.record(`${kind} resize ${width}`, {
              viewport: ctx.inspect('content-flow-viewport'),
              content,
            })

            return Math.abs((content.frame?.width ?? 0) - width) <= 1
          },
          { timeout: 5000 },
        )

        ctx.assert(
          `${kind} follows resized viewport ${width}`,
          Math.abs(ctx.inspect('body-first').frame!.width - width) <= 1,
        )

        ctx.assert(
          `${kind} retains content on resize ${width}`,
          ctx.find('body-first') === original,
        )
      }
    }
  }
}
