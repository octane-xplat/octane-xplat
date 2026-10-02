import { createRoot, useRef, useState } from 'octane'
import { BottomSheet as PlatformBottomSheet } from '../../../packages/sheet/src/web/index'

function SheetReadiness() @{
	const [open, setOpen] = useState(false)
	const [locked, setLocked] = useState(false)
	const [dismissals, setDismissals] = useState(0)
	const sheetTrigger = useRef<HTMLButtonElement | null>(null)
	const dismiss = () => {
		setDismissals(dismissals + 1)
		setOpen(false)
	}

	<>
		<button ref={sheetTrigger} id="open-platform-sheet" onClick={() => setOpen(true)}>Open platform sheet</button>
		<output id="dismissals">{dismissals}</output>
		<PlatformBottomSheet
			id="platform-sheet-panel"
			label="Account actions"
			className="consumer-sheet-class"
			style={{ padding: '12px', minHeight: '320px' }}
			finalFocusRef={sheetTrigger}
			open={open}
			onDismissed={dismiss}
			containerColor="rgb(240, 240, 240)"
			contentColor="rgb(24, 24, 24)"
			scrimColor="rgb(0 0 0 / 0.5)"
			content={() => <>
				<button id="platform-sheet-first">First action</button>
				<button id="platform-sheet-last" onClick={() => setOpen(false)}>Close sheet</button>
			</>}
		/>
		<button id="open-locked-platform-sheet" onClick={() => setLocked(true)}>Open locked sheet</button>
		<PlatformBottomSheet
			label="Required actions"
			open={locked}
			shouldDismissOnBackPress={false}
			shouldDismissOnClickOutside={false}
			sheetGesturesEnabled={false}
			content={() => <button id="close-locked-platform-sheet" onClick={() => setLocked(false)}>Close</button>}
		/>
	</>
}

createRoot(document.getElementById('root')!).render(<SheetReadiness />)
