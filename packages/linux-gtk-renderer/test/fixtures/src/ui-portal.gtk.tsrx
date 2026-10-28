/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext, useEffect, useState } from 'octane'
import { View, Text, Pressable } from '@octane-xplat/ui'
import { createPortal } from '../../../../ui/src/native-portal'

const Context = createContext('missing')
export const refs: Record<string, any> = {}
export const lifetime = { mounts: 0, unmounts: 0 }
const capture = (id: string) => (view: any) => { refs[id] = view }

function Panel(props: { name: string }) @{
 const value = useContext(Context)
 const [count, setCount] = useState(0)
 useEffect(() => { lifetime.mounts++; return () => { lifetime.unmounts++ } }, [])
 <proxyviewcontainer>
  <label id={'portal-label-' + props.name} ref={capture('label-' + props.name)} text={value + ':' + props.name + ':' + count} />
  <Pressable id={'portal-action-' + props.name} ref={capture('action-' + props.name)} onPress={() => setCount(count + 1)} style={{ width: 90, height: 30 }}>
   <Text>Increment</Text>
  </Pressable>
 </proxyviewcontainer>
}
function Slot(props: { target: any; name: string }) @{
 <>{createPortal(<Panel name={props.name} />, props.target)}</>
}
export function Portals(props: { target: any; value: string; order: string[]; show?: boolean }) @{
 <Context value={props.value}>
  <View id="portal-source" style={{ width: 260, height: 60 }}>
   <View id="portal-owned-target" ref={capture('owned')} style={{ width: 240, height: 50 }}>
    <Text id="owned-prefix">Owned prefix</Text>
   </View>
   <contentview ref={capture('logical')} />
  </View>
  {(props.show ?? true) ? props.order.map(name => <Slot key={name} name={name} target={props.target} />) : null}
 </Context>
}
