/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'

interface Reports {
  onLoaded: () => void
  onPan: (event: unknown) => void
}

function Controls({ revision, onLoaded, onPan }: Reports & { revision: string }) {
  const [count, setCount] = useState(0)
  const [value, setValue] = useState('first')
  return (
    <masonview id="row" onPan={onPan} style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
      <button id="button" onTap={() => setCount(count + 1)} onLoaded={onLoaded}>
        {revision}:{count}
      </button>
      <textfield id="entry" text={value} onTextChange={(event) => setValue(String(event.value))} />
      <label id="value" text={value} />
      <switch id="switch" checked={count > 0} />
    </masonview>
  )
}

export function First(props: Reports) {
  return <Controls {...props} revision="first" />
}

export function Updated(props: Reports) {
  return <Controls {...props} revision="updated" />
}
