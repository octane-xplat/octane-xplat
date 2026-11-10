/** @jsxImportSource @octane-xplat/jsx */
// Packaged OS-input qualification fixtures. The external driver supplies real
// keyboard/mouse input and reads UIA; this scene emits input-event/key-event
// records and renders state the driver can observe.
import { useEffect, useRef, useState } from 'octane'
import { Button, Text, TextArea, TextInput, VStack, useScrollableArea } from '@octane-xplat/ui'
import type { TextInputHandle } from '@octane-xplat/ui'

export type InputEmit = (event: string, data?: Record<string, unknown>) => void

/** Attach raw keyDown/keyUp listeners to a rendered field's native view. The
 * patched core attaches the WinUI delegates lazily on load, so subscribing
 * through the ref handle before or after load both land. */
function watchKeys(
  handle: () => TextInputHandle | null | undefined,
  source: string,
  emit: InputEmit,
  consumeKey?: number,
): () => void {
  const view = () => {
    const native = handle()?.native as any

    return typeof native?.on === 'function' ? native : null
  }

  const emitKey = (kind: string) => (event: any) => {
    emit('key-event', {
      source,
      kind,
      key: event?.nativeEvent?.Key,
      handled: event?.nativeEvent?.Handled === true,
    })

    if (kind === 'down' && consumeKey != null && event?.nativeEvent?.Key === consumeKey) {
      event.nativeEvent.Handled = true
    }
  }

  const down = emitKey('down')
  const up = emitKey('up')
  let attached = false
  const timer = setInterval(() => {
    const v = view()

    if (v && !attached) {
      v.on('keyDown', down)
      v.on('keyUp', up)
      attached = true
      clearInterval(timer)
    }
  }, 150)

  return () => {
    clearInterval(timer)

    const v = view()

    if (v && attached) {
      v.off('keyDown', down)
      v.off('keyUp', up)
      attached = false
    }
  }
}

/** Controlled fields plus a form pair. onChange/onSubmit/onFocus/onBlur emit
 * input-event records; raw key channels emit key-event records so the driver
 * can correlate OS input with projection payloads and app callbacks. */
export function InputCases(props: {
  emit: InputEmit
  mounted: boolean
  controlledValue: string
  onControlledWrite: (value: string) => void
}): unknown @{
  const emit = props.emit
  const [secureValue, setSecureValue] = useState('hunter2')
  const [multiValue, setMultiValue] = useState('line one')
  const [formUser, setFormUser] = useState('ruby')
  const [formPass, setFormPass] = useState('')
  const controlledRef = useRef<TextInputHandle | null>(null)
  const secondRef = useRef<TextInputHandle | null>(null)
  const secureRef = useRef<TextInputHandle | null>(null)
  const consumedRef = useRef<TextInputHandle | null>(null)

  useEffect(() => watchKeys(() => controlledRef.current, 'controlled', emit), [])
  useEffect(() => watchKeys(() => secondRef.current, 'second', emit), [])
  useEffect(() => watchKeys(() => secureRef.current, 'secure', emit), [])
  useEffect(() => watchKeys(() => consumedRef.current, 'consumed', emit, 13), [])

  const emitChange = (source: string) => (next: string) =>
    emit('input-event', { source, kind: 'change', value: next })

  const emitSubmit = (source: string) => () => emit('input-event', { source, kind: 'submit' })
  const emitFocus = (source: string) => () => emit('input-event', { source, kind: 'focus' })
  const emitBlur = (source: string) => () => emit('input-event', { source, kind: 'blur' })

  const shared = (source: string) => ({
    onSubmit: emitSubmit(source),
    onFocus: emitFocus(source),
    onBlur: emitBlur(source),
  })

  <VStack width="100%" gap={2} padding={4} style={{ flexGrow: 1 }}>
    <Text id="input-status">{`Core20 input mounted=${props.mounted} controlled=${props.controlledValue}`}</Text>
    @if (props.mounted) {
      <>
        <TextInput
          id="input-controlled"
          ref={controlledRef}
          value={props.controlledValue}
          accessibilityLabel="Controlled field"
          returnKeyType="done"
          onChange={(next: string) => {
            emit('input-event', { source: 'controlled', kind: 'change', value: next })
            props.onControlledWrite(next)
          }}
          {...shared('controlled')}
        />
        <TextInput
          id="input-second"
          ref={secondRef}
          defaultValue="second"
          accessibilityLabel="Second field"
          onChange={emitChange('second')}
          {...shared('second')}
        />
        <TextInput
          id="input-secure"
          ref={secureRef}
          value={secureValue}
          secure={true}
          accessibilityLabel="Secure field"
          onChange={(next: string) => {
            emit('input-event', { source: 'secure', kind: 'change' })
            setSecureValue(next)
          }}
          {...shared('secure')}
        />
        <TextInput
          id="input-readonly"
          value="frozen"
          isReadOnly={true}
          accessibilityLabel="Readonly field"
          onChange={emitChange('readonly')}
          {...shared('readonly')}
        />
        <TextInput
          id="input-disabled"
          value="blocked"
          isDisabled={true}
          accessibilityLabel="Disabled field"
          onChange={emitChange('disabled')}
          {...shared('disabled')}
        />
        <TextInput
          id="input-form-user"
          value={formUser}
          accessibilityLabel="Form user"
          returnKeyType="next"
          onChange={(next: string) => {
            emit('input-event', { source: 'form-user', kind: 'change', value: next })
            setFormUser(next)
          }}
          {...shared('form-user')}
        />
        <TextInput
          id="input-form-pass"
          value={formPass}
          secure={true}
          accessibilityLabel="Form pass"
          returnKeyType="send"
          onChange={(next: string) => {
            emit('input-event', { source: 'form-pass', kind: 'change' })
            setFormPass(next)
          }}
          {...shared('form-pass')}
        />
        <TextInput
          id="input-consumed"
          ref={consumedRef}
          defaultValue="eaten"
          accessibilityLabel="Consumed field"
          returnKeyType="done"
          onChange={emitChange('consumed')}
          {...shared('consumed')}
        />
        <TextArea
          id="input-multiline"
          value={multiValue}
          rows={3}
          accessibilityLabel="Multiline field"
          onChange={(next: string) => {
            emit('input-event', { source: 'multiline', kind: 'change', value: next })
            setMultiValue(next)
          }}
          onSubmit={emitSubmit('multiline')}
        />
      </>
    }
    <Button
      id="input-focus-second"
      label="Focus second"
      onPress={() => secondRef.current?.focus()}
    />
  </VStack>
}

/** Scroll viewport fixture: a bounded block-axis viewport whose content grows
 *  on command. Live edge state renders as text the driver reads through UIA,
 *  and each state transition emits a scroll-state record. */
export function ScrollCases(props: {
  emit: InputEmit
  rows: number
  axis: 'block' | 'inline'
}): unknown @{
  const area = useScrollableArea<any>({ axis: props.axis })
  const axisState = props.axis === 'block' ? area.state.block : area.state.inline
  const emitRef = useRef(props.emit)

  emitRef.current = props.emit

  const last = useRef('')

  useEffect(() => {
    const summary = `${props.axis}:${axisState.isScrollable}:${axisState.atStart}:${axisState.atEnd}`

    if (summary !== last.current) {
      last.current = summary
      emitRef.current('scroll-state', {
        axis: props.axis,
        isScrollable: axisState.isScrollable,
        atStart: axisState.atStart,
        atEnd: axisState.atEnd,
      })
    }
  }, [axisState.isScrollable, axisState.atStart, axisState.atEnd, props.axis])

  const rows = []

  for (let index = 0; index < props.rows; index++) {
    rows.push(<Text key={`scroll-${index}`}>{`Scroll row ${index}`}</Text>)
  }

  <VStack width="100%" gap={2} padding={4} style={{ flexGrow: 1 }}>
    <Text id="scroll-status">
      {`Core20 scroll axis=${props.axis} rows=${props.rows} scrollable=${axisState.isScrollable} start=${axisState.atStart} end=${axisState.atEnd}`}
    </Text>
    <scrollview
      id="scroll-viewport"
      {...area.getViewportProps({ className: 'qualification-scroll-viewport' })}
    >
      <masonview
        id="scroll-content"
        {...area.getContentProps({ className: 'qualification-scroll-content' })}
      >
        {rows}
      </masonview>
    </scrollview>
  </VStack>
}
