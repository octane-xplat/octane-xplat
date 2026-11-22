/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../internal/layout/style-merge'
import type { ChatMessageMetadataProps, ChatMessageStatus, Renderable } from '../props'
import { Icon } from '../components/media/Icon.tsrx'
import { useChatMessageContext } from './chat-context.tsrx'

const STATUS_ICON: Record<ChatMessageStatus, string> = {
  sending: 'xplat-clock',
  sent: 'xplat-check',
  delivered: 'xplat-check-double',
  read: 'xplat-check-double',
  error: 'xplat-error',
}

const STATUS_LABEL: Record<ChatMessageStatus, string> = {
  sending: 'Sending',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  error: 'Failed',
}

const renderable = (v: any) => v != null && v !== false && v !== true

function MetadataPart(props: { children: Renderable }): unknown @{
  const value = props.children
  @if (typeof value === 'string' || typeof value === 'number') {
    <label className="vx-chatmeta-part" text={String(value)} />
  } @else {
    <masonview className="vx-chatmeta-part" style={{ display: 'flex' }}>
      {value}
    </masonview>
  }
}

/** Composable metadata row for chat messages — timestamp · footer · status.
 *  Renders nothing when all three are absent. User-sender rows right-align
 *  (the DOM leaf uses row-reverse; NS children order is explicit). */
export function ChatMessageMetadata(props: ChatMessageMetadataProps): unknown @{
  const msgContext = useChatMessageContext()
  const sender = msgContext?.sender ?? 'assistant'
  const hasTimestamp = renderable(props.timestamp)
  const hasFooter = renderable(props.footer)
  const hasStatus = props.status != null

  if (!hasTimestamp && !hasFooter && !hasStatus) {
    return null
  }

  const status = props.status!
  const isUser = sender === 'user'

  <masonview
    id={props.id}
    className={['vx-chatmeta', isUser && 'vx-chatmeta--user', props.className]}
    style={mergeStyle(
      { justifyContent: isUser ? 'flex-end' : 'flex-start' },
      mergeStyle({ display: 'flex' }, props.style),
    )}
  >
    @if (hasTimestamp) {
      <MetadataPart>{props.timestamp}</MetadataPart>
    }
    @if (hasTimestamp && (hasFooter || hasStatus)) {
      <label className="vx-chatmeta-sep" text="·" />
    }
    @if (hasFooter) {
      <MetadataPart>{props.footer}</MetadataPart>
    }
    @if (hasFooter && hasStatus) {
      <label className="vx-chatmeta-sep" text="·" />
    }
    @if (hasStatus) {
      <masonview
        className={['vx-chatmeta-status', `vx-chatmeta-status--${status}`]}
        accessibilityLabel={`Message ${STATUS_LABEL[status].toLowerCase()}`}
        style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
      >
        <Icon name={STATUS_ICON[status]} size={12} />
        <label className="vx-chatmeta-status-text" text={STATUS_LABEL[status]} />
      </masonview>
    }
  </masonview>
}
