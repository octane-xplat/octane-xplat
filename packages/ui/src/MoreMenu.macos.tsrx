/** @jsxImportSource @octane-xplat/macos-renderer */
import { useState } from 'octane'
import type { MoreMenuProps, MoreMenuPlacement } from './props'
import { DropdownMenu } from './DropdownMenu.macos.tsrx'
import { useSize } from './size-context'
import { Pressable } from './Pressable.macos.tsrx'
import { BottomSheet } from './BottomSheet.macos.tsrx'
import { Icon } from './Icon.macos.tsrx'
import { cx } from '@octane-xplat/lib'

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
	const size=useSize(props.size,'md')
	const triggerClass=cx('vx-button',`vx-button--${props.variant??'ghost'}`,`vx-button--size-${size}`,'vx-button--icon','vx-more-menu-trigger',props.isDisabled&&'vx-button--disabled')

	@if (presentation === 'bottom-sheet' || presentation === 'adaptive') {
		<>
		<Pressable id={props.id} className={triggerClass} style={props.style} disabled={props.isDisabled} onPress={()=>setOpen(!open)} accessibilityRole="button" accessibilityLabel={props.label??'More options'} accessibilityState={{disabled:props.isDisabled}}>{icon}</Pressable>
			<BottomSheet isOpen={open} onOpenChange={setOpen} label={props.label??'More options'} snapPoints={[0.5,1]} className="vx-more-menu-sheet"><masonview className="vx-more-menu-sheet-list" style={{display: "flex"}}>{props.items.map(item=><MenuItemView key={item.key} className={cx('vx-menu-item',item.isDisabled&&'vx-menu-item--disabled')} disabled={item.isDisabled} onPress={()=>{if(item.isDisabled)return;setOpen(false);item.onSelect?.()}}>{item.icon?<Icon name={item.icon}/>:null}<label text={item.label??''}/></MenuItemView>)}</masonview></BottomSheet>
		</>
	} @else {
		<DropdownMenu id={props.id} className={props.className} style={props.style} items={props.items} isDisabled={props.isDisabled} isOpen={open} onOpenChange={setOpen} placement={popoverPlacement(props.placement)} alignment={props.alignment} accessibilityLabel={props.label??'More options'} triggerClassName={triggerClass} size={props.size} trigger={icon}/>
	}
}
