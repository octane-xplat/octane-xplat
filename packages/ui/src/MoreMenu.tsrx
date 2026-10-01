/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane'
import type { MoreMenuProps, MoreMenuPlacement } from './props'
import { DropdownMenu } from './DropdownMenu.tsrx'
import { Pressable } from './Pressable.tsrx'
import { Sheet } from './Sheet.tsrx'
import { Icon } from './Icon.tsrx'
import { cx } from './cx'

function popoverPlacement(placement?: MoreMenuPlacement): any {
	if (placement === 'above') return 'top'
	if (placement === 'below' || placement == null) return 'bottom'
	if (placement === 'start') return 'left'
	if (placement === 'end') return 'right'
	return placement
}

export function MoreMenu(props: MoreMenuProps) @{
	const [localOpen,setLocalOpen]=useState(false)
	const MenuItemView: any = Pressable
	const open=props.isMenuOpen??localOpen
	const presentation=props.presentation??'popover'
	const setOpen=(next:boolean)=>{if(props.isMenuOpen===undefined)setLocalOpen(next);props.onOpenChange?.(next)}
	const icon=typeof props.icon==='string'?<Icon name={props.icon}/>:props.icon??<Icon name="xplat-more-horizontal"/>
	const triggerClass=cx('vx-button',`vx-button--${props.variant??'ghost'}`,`vx-button--size-${props.size??'md'}`,'vx-button--icon','vx-more-menu-trigger',props.isDisabled&&'vx-button--disabled')

	@if (presentation === 'bottom-sheet' || presentation === 'adaptive') {
		<>
			<Pressable id={props.id} className={triggerClass} style={props.style} disabled={props.isDisabled} onPress={()=>setOpen(!open)} accessibilityRole="button" accessibilityLabel={props.label??'More options'} accessibilityState={{disabled:props.isDisabled}}>{icon}</Pressable>
			<Sheet open={open} onDismiss={()=>setOpen(false)} detents={[0.5,1]} className="vx-more-menu-sheet"><flexboxlayout className="vx-more-menu-sheet-list">{props.items.map(item=><MenuItemView key={item.key} className={cx('vx-menu-item',item.disabled&&'vx-menu-item--disabled')} disabled={item.disabled} onPress={()=>{if(item.disabled)return;setOpen(false);item.onSelect?.()}}>{item.icon?<Icon name={item.icon}/>:null}<label text={item.label??''}/></MenuItemView>)}</flexboxlayout></Sheet>
		</>
	} @else {
		<DropdownMenu id={props.id} className={props.className} style={props.style} items={props.items} disabled={props.isDisabled} open={open} onOpenChange={setOpen} placement={popoverPlacement(props.placement)} alignment={props.alignment} accessibilityLabel={props.label??'More options'} triggerClassName={triggerClass} trigger={icon}/>
	}
}
