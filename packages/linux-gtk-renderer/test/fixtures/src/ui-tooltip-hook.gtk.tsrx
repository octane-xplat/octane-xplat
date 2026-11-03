/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext, useEffect } from 'octane'
import { Text, View, useTooltip } from '@octane-xplat/ui'
import type { ContextRenderProps, TooltipOptions, TooltipReturn } from '@octane-xplat/ui'

const Context = createContext('missing')
export const lifetime = { mounts: 0, unmounts: 0 }
export let binding: TooltipReturn
function Content() @{
  const text = useContext(Context)
  useEffect(() => {
    lifetime.mounts++
    return () => {
      lifetime.unmounts++
    }
  }, [])

  <Text id="hook-content">{text}</Text>
}

export function EmptyTooltipScene() @{
  <View />
}

export function TooltipHookScene(props: {
  options?: TooltipOptions
  renderProps?: Omit<ContextRenderProps, 'positioning'>
  split?: boolean
  plain?: boolean
  nested?: boolean
  value?: string
}) @{
  const tip = useTooltip(props.options)
  binding = tip

  <Context value={props.value ?? 'First'}>
    <View style={{ width: 400, height: 240, padding: 30 }}>
      {props.plain ? (
        <View
          id="hook-trigger"
          ref={props.split ? tip.interactionRef : tip.ref}
          style={{ width: 200, height: 36 }}
        >
          {props.nested ? (
            <button id="hook-action" text="Action" style={{ width: 200, height: 36 }} />
          ) : null}
        </View>
      ) : (
        <textfield
          id="hook-trigger"
          ref={props.split ? tip.interactionRef : tip.ref}
          text="Trigger"
          style={{ width: 200, height: 36 }}
        />
      )}
      <View
        id="hook-position"
        ref={props.split ? tip.positionRef : undefined}
        style={{ width: 80, height: 20 }}
      />
      <textfield id="hook-peer" text="Peer" style={{ width: 200, height: 36 }} />
      {tip.renderTooltip(<Content />, props.renderProps)}
    </View>
  </Context>
}
