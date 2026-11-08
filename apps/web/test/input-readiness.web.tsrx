/** @jsxImportSource @octane-xplat/jsx/dom */
import { createRoot, useState, useRef } from 'octane'
import {
  BottomSheet,
  CommandPalette,
  Overlay,
  Popover,
  Slider,
  Pressable,
  TextArea,
  TextInput,
  View,
} from '@octane-xplat/ui'

import { motion, Presence } from '../../../packages/motion/src/index.web'

function ModalPopoverButton(props: { name: string }) @{
  const anchor = useRef<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  const [clicks, setClicks] = useState(0)

  <>
    <button ref={anchor} id={`${props.name}-popover-trigger`} onClick={() => setOpen(true)}>
      Choose option
    </button>
    <Popover anchor={anchor} open={open} onDismiss={() => setOpen(false)}>
      <button id={`${props.name}-popover-option`} onClick={() => setClicks(clicks + 1)}>
        Option
      </button>
      <output id={`${props.name}-popover-clicks`}>{clicks}</output>
    </Popover>
  </>
}

function InputReadiness() @{
  const [count, setCount] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const [value, setValue] = useState('hello')
  const [changes, setChanges] = useState(0)
  const [sheet, setSheet] = useState(false)
  const [overlay, setOverlay] = useState(false)
  const [commandPalette, setCommandPalette] = useState(false)
  const [present, setPresent] = useState(true)
  const [panLog, setPanLog] = useState<string[]>([])
  const [panPresses, setPanPresses] = useState(0)
  const [panSelfLog, setPanSelfLog] = useState<string[]>([])
  const [panSelfPresses, setPanSelfPresses] = useState(0)
  const change = (text: string) => {
    setChanges(changes + 1)
    setValue(text)
  }

  <>
    <Pressable id="action" onPress={() => setCount(count + 1)}>
      Save
    </Pressable>
    <Pressable id="disabled" disabled onPress={() => setCount(count + 1)}>
      Disabled
    </Pressable>
    <output id="count">{count}</output>
    <TextInput id="input" value={value} onChange={change} />
    <TextArea id="area" value={value} onChange={change} />
    <output id="changes">{changes}</output>
    <button id="write" onClick={() => setValue('replacement')}>
      Write controlled value
    </button>
    <button id="open-sheet" onClick={() => setSheet(true)}>
      Open sheet
    </button>
    <button id="open-overlay" onClick={() => setOverlay(true)}>
      Open overlay
    </button>
    <button id="open-command-palette" onClick={() => setCommandPalette(true)}>
      Open command palette
    </button>
    <BottomSheet isOpen={sheet} onOpenChange={(open) => setSheet(open)} label="Input sheet">
      <button id="sheet-first">First</button>
      <button id="sheet-nested" onClick={() => setOverlay(true)}>
        Nested overlay
      </button>
      <ModalPopoverButton name="sheet" />
      <button id="sheet-last" onClick={() => setSheet(false)}>
        Close
      </button>
    </BottomSheet>
    <Overlay
      open={overlay}
      shadeCover
      accessibilityLabel="Input overlay"
      onDismiss={() => setOverlay(false)}
    >
      <button id="overlay-first">First</button>
      <ModalPopoverButton name="overlay" />
      <button id="overlay-last" onClick={() => setOverlay(false)}>
        Close
      </button>
    </Overlay>
    <CommandPalette open={commandPalette} onOpenChange={setCommandPalette} items={[]} />
    <button id="slider-before" tabIndex={0}>
      Before volume
    </button>
    <Slider
      id="volume"
      value={volume}
      minValue={0}
      maxValue={1}
      onValueChange={(v) => setVolume(v as number)}
      web={{ 'aria-label': 'Volume' }}
    />
    <Slider
      id="disabled-volume"
      value={0.5}
      disabled
      onValueChange={() => {
        throw new Error('disabled slider changed')
      }}
    />
    <button id="slider-after" tabIndex={0}>
      After volume
    </button>
    <View id="pan-host" onPan={(e) => setPanLog([...panLog, e.state])} style={{ padding: 24 }}>
      <Pressable id="pan-nested" onPress={() => setPanPresses(panPresses + 1)}>
        Nested action
      </Pressable>
    </View>
    <output id="pan-log">{panLog.join(',')}</output>
    <output id="pan-presses">{panPresses}</output>
    <Pressable
      id="pan-self"
      onPan={(e) => setPanSelfLog([...panSelfLog, e.state])}
      onPress={() => setPanSelfPresses(panSelfPresses + 1)}
    >
      Pan pressable
    </Pressable>
    <output id="pan-self-log">{panSelfLog.join(',')}</output>
    <output id="pan-self-presses">{panSelfPresses}</output>
    <button id="exit" onClick={() => setPresent(false)}>
      Exit
    </button>
    <button id="reverse" onClick={() => setPresent(true)}>
      Reverse
    </button>
    <Presence present={present}>
      <motion.View exit={{ opacity: 0 }} transition={{ duration: 5 }}>
        <TextInput id="presence-input" value="retained" />
        <Pressable id="presence-action" onPress={() => setCount(count + 1)}>
          Retained action
        </Pressable>
      </motion.View>
    </Presence>
  </>
}

createRoot(document.getElementById('root')!).render(<InputReadiness />)
