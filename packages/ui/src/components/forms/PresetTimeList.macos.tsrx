/** @jsxImportSource @octane-xplat/jsx */
import type { NSView } from '@octane-xplat/platform/macos'
import './PresetTimeList.macos.css'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'octane'
import { cx } from '@octane-xplat/lib'
import { createAppKitTimeListFocus, type AppKitTimeOption } from './time-list-focus.macos'
import type { ISOTimeString } from '../../props'
interface Props {
	options: readonly AppKitTimeOption[]
	seed?: ISOTimeString
	selected?: ISOTimeString
	blocked: boolean
	label: string
	hint?: string
	choose(time: ISOTimeString): void
	tab(backward: boolean): boolean
}
interface RowProps {
	option: AppKitTimeOption
	selected: boolean
	highlighted: boolean
	blocked: boolean
	register(time: ISOTimeString, view: NSView): () => void
	choose(time: ISOTimeString): void
}
function TimeRow(props: RowProps) @{
	const live = useRef(props), view = useRef<NSView | null>(null), release = useRef<(() => void) | null>(null)
	live.current = props
	const bind = useCallback((next: NSView | null) => {
		release.current?.(); release.current = null; view.current = next
		if (next) release.current = live.current.register(live.current.option.time, next)
	}, [])
	<masonview ref={bind} disabled={props.blocked}
		className={cx('vx-datetimeinput-timeoption', 'vx-timeoption--appkit', props.selected && 'vx-datetimeinput-timeoption--selected', props.highlighted && 'vx-datetimeinput-timeoption--highlighted')}
		accessibilityRole="button" accessibilityLabel={props.option.label}
		accessibilityState={{ disabled: props.blocked, selected: props.selected }}
		onTap={props.blocked ? undefined : () => { if (view.current && !live.current.blocked) live.current.choose(live.current.option.time) }}>
		<label text={props.option.label} />
	</masonview>
}
export function AppKitPresetTimeList(props: Props) @{
	const live = useRef(props); live.current = props
	const [highlighted, setHighlighted] = useState<string | undefined>(undefined)
	const focus = useMemo(() => createAppKitTimeListFocus({ rows: () => live.current.options, seed: () => live.current.seed,
		blocked: () => live.current.blocked, choose: (time) => live.current.choose(time), tab: (backward) => live.current.tab(backward), highlight: setHighlighted,
	}), [])
	const bind = useCallback((view: NSView | null) => focus.bind(view), [])
	useLayoutEffect(() => { focus.update() }, [props.options, props.seed, props.blocked])
	useLayoutEffect(() => () => focus.dispose(), [])
	<scrollview className="vx-datetimeinput-timelist">
		<masonview ref={bind} onKeyDown={focus.keyDown} className="vx-timelist--appkit"
			accessibilityRole="group" accessibilityLabel={props.label} accessibilityHint={props.hint}>
			{props.options.map((option) => <TimeRow key={option.time} option={option} selected={option.time === props.selected}
				highlighted={option.time === highlighted} blocked={props.blocked} register={focus.register} choose={focus.activate} />)}
		</masonview>
	</scrollview>
}
