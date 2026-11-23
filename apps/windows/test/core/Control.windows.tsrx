import { useEffect, useState } from 'octane'
import { initialInput } from './Control.tsrx'

export function Control(props: { disposed: () => void }) @{
  const [count, setCount, getCount] = useState(0)
  useEffect(() => props.disposed, [])

  <masonview
    id="layout"
    width={240}
    horizontalAlignment="left"
    style={{ display: 'flex', flexDirection: 'column' }}
  >
    <button id="action" text="Increment" onTap={() => setCount(getCount() + 1)} />
    <textfield id="input" text={initialInput} />
    <label id="value" text={`initial:${count}`} />
  </masonview>
}
