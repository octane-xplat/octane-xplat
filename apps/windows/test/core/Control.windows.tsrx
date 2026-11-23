import { useEffect, useState } from 'octane'

export function Control(props: { disposed: () => void }) @{
  const [count, setCount, getCount] = useState(0)
  useEffect(() => props.disposed, [])

  <masonview id="layout" style={{ display: 'flex', flexDirection: 'column', width: 240 }}>
    <button id="action" text="Increment" onTap={() => setCount(getCount() + 1)} />
    <textfield id="input" text="Editable" />
    <label id="value" text={`initial:${count}`} />
  </masonview>
}
