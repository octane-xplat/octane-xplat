/** @jsxImportSource @octane-xplat/jsx/dom */
import { createRoot, useState } from 'octane'
import { SmoothCorners } from '@octane-xplat/smooth-corners'
import './style.css'

function App() @{
  const [overflow, setOverflow] = useState<'visible' | 'hidden' | undefined>()
  const [classClip, setClassClip] = useState(false)
  const [layeredClip, setLayeredClip] = useState(false)
  const [wide, setWide] = useState(false)
  const [clicks, setClicks] = useState(0)

  return (
    <div>
      <button id="hide" onClick={() => setOverflow('hidden')}>
        Hide
      </button>
      <button id="show" onClick={() => setOverflow('visible')}>
        Show
      </button>
      <button id="reset" onClick={() => setOverflow(undefined)}>
        Reset
      </button>
      <button id="resize" onClick={() => setWide(!wide)}>
        Resize
      </button>
      <button id="class-clip" onClick={() => setClassClip(!classClip)}>
        Toggle class
      </button>
      <button id="class-clip-layered" onClick={() => setLayeredClip(!layeredClip)}>
        Toggle layered class
      </button>
      <div style={{ width: 400 }}>
        <SmoothCorners
          id="percent"
          corners={24}
          style={{ width: '50%', height: 100, padding: 8, backgroundColor: '#fff' }}
        />
      </div>
      <SmoothCorners id="class-only" className="panel" corners={24} />
      <SmoothCorners
        id="transformed"
        className="panel"
        corners={24}
        style={{ transform: 'scale(1.2)', opacity: 0.5 }}
      />
      <output id="clicks">{clicks}</output>
      <SmoothCorners
        id="panel"
        className={['panel', classClip && 'clip-children', layeredClip && 'clip-layered']}
        corners={{ radius: 24 }}
        border={{ width: 3, color: '#0000ff' }}
        shadow={{ blur: 8, color: '#000000', spread: 2 }}
        style={{ overflow, width: wide ? 260 : 200 }}
      >
        <button id="badge" onClick={() => setClicks(clicks + 1)}>
          Badge
        </button>
        <span>Content</span>
      </SmoothCorners>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
