import { useEffect, useState } from 'octane'
import type { MoreMenuProps, MoreMenuPlacement } from './props'
import { DropdownMenu } from './DropdownMenu.web.tsrx'
import { Pressable } from './Pressable.web.tsrx'
import { Sheet } from './Sheet.web.tsrx'
import { Icon } from './Icon.web.tsrx'

function popoverPlacement(placement?:MoreMenuPlacement):any {
	if(placement==='above')return 'top';if(placement==='below'||placement==null)return 'bottom';if(placement==='start')return 'left';if(placement==='end')return 'right';return placement
}

export function MoreMenu(props: MoreMenuProps) @{
	const [localOpen,setLocalOpen]=useState(false)
	const MenuItemView: any = Pressable
	const [adaptiveSheet,setAdaptiveSheet]=useState(false)
	useEffect(()=>{
		if(props.presentation!=='adaptive') {setAdaptiveSheet(false);return}
		const query=window.matchMedia('(max-width: 768px) and (pointer: coarse)')
		const update=()=>setAdaptiveSheet(query.matches)
		update();query.addEventListener?.('change',update)
		return ()=>query.removeEventListener?.('change',update)
	},[props.presentation])

	const open=props.isMenuOpen??localOpen
	const presentation=props.presentation??'popover'
	const useSheet=presentation==='bottom-sheet'||(presentation==='adaptive'&&adaptiveSheet)
	const setOpen=(next:boolean)=>{if(props.isMenuOpen===undefined)setLocalOpen(next);props.onOpenChange?.(next)}
	const icon=typeof props.icon==='string'?<Icon name={props.icon}/>:props.icon??<Icon name="xplat-more-horizontal"/>
	const triggerClass=['vx-button',`vx-button--${props.variant??'ghost'}`,`vx-button--size-${props.size??'md'}`,'vx-button--icon','vx-more-menu-trigger',props.isDisabled?'vx-button--disabled':undefined]

	@if (useSheet) {
		<>
			<Pressable id={props.id} className={triggerClass} style={props.style} disabled={props.isDisabled} onPress={()=>setOpen(!open)} accessibilityRole="button" accessibilityLabel={props.label??'More options'} accessibilityState={{disabled:props.isDisabled}}>{icon}</Pressable>
			<Sheet open={open} onDismiss={()=>setOpen(false)} detents={[0.5,1]} className="vx-more-menu-sheet"><div className="vx-more-menu-sheet-list">{props.items.map(item=><MenuItemView key={item.key} className={['vx-menu-item',item.disabled?'vx-menu-item--disabled':undefined]} disabled={item.disabled} onPress={()=>{if(item.disabled)return;setOpen(false);item.onSelect?.()}}>{item.icon?<Icon name={item.icon}/>:null}{item.label}</MenuItemView>)}</div></Sheet>
		</>
	} @else {
		<DropdownMenu id={props.id} className={props.className} style={props.style} items={props.items} disabled={props.isDisabled} open={open} onOpenChange={setOpen} placement={popoverPlacement(props.placement)} alignment={props.alignment} accessibilityLabel={props.label??'More options'} triggerClassName={triggerClass} trigger={icon}/>
	}
}
