import { useEffect, useRef } from 'octane'
import type { ButtonGroupProps } from './props'
import { ButtonGroupProvider } from './button-group-context'

export function ButtonGroup(props: ButtonGroupProps) @{
	const orientation = props.orientation ?? 'horizontal'
	const groupRef = useRef<any>(null)
	const value = { orientation, isDisabled: !!props.isDisabled, size: props.size ?? 'md', position: 'only' as const }
	useEffect(() => {
		const root = groupRef.current
		if (!root) return
		const members = () => Array.from(root.querySelectorAll('button:not([disabled]), [role="button"]:not([aria-disabled="true"]), a[href]')) as HTMLElement[]
		const update = (active?: HTMLElement) => {
			const enabled = members()
			for (const member of enabled) member.tabIndex = member === active || (!active && member === enabled[0]) ? 0 : -1
		}

		update()
		const focus = (event: FocusEvent) => { const target = event.target as HTMLElement; if (members().includes(target)) update(target) }
		root.addEventListener('focusin', focus)
		return () => root.removeEventListener('focusin', focus)
	}, [props.children, props.isDisabled])

	const onKeyDown = (event: any) => {
		const keys = orientation === 'horizontal' ? ['ArrowLeft','ArrowRight'] : ['ArrowUp','ArrowDown']
		if (![...keys,'Home','End'].includes(event.key)) return
		const enabled = Array.from(groupRef.current?.querySelectorAll('button:not([disabled]), [role="button"]:not([aria-disabled="true"]), a[href]') ?? []) as HTMLElement[]
		if (!enabled.length) return
		event.preventDefault()
		const index = enabled.indexOf(document.activeElement as HTMLElement)
		const next = event.key==='Home'?0:event.key==='End'?enabled.length-1:Math.max(0,Math.min(enabled.length-1,index+(event.key===keys[0]?-1:1)))
		updateTabStops(next, enabled)
		enabled[next].focus()
	}

	<ButtonGroupProvider value={value}>
		<div ref={(node:any)=>groupRef.current=node} id={props.id} role="group" aria-label={props.label} className={['vx-button-group', `vx-button-group--${orientation}`, props.className]} style={props.style} onKeyDown={onKeyDown}>
			{props.children}
		</div>
	</ButtonGroupProvider>
}

function updateTabStops(index:number, members:HTMLElement[]) {
	for (let i=0;i<members.length;i++) members[i].tabIndex=i===index?0:-1
}
