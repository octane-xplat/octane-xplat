/** @jsxImportSource @octane-xplat/jsx/dom */
import { useEffect } from 'octane'
import { Text } from '@octane-xplat/ui'

export function BaselineEntry() @{
  useEffect(() => {
    location.replace('/?baseline')
  }, [])

  <Text>Opening isolated baseline…</Text>
}
