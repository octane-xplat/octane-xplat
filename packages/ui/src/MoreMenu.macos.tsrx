/** @jsxImportSource @octane-xplat/macos-renderer */
import { useState } from 'octane'
import type { MoreMenuProps, MoreMenuPlacement } from './props'
import { DropdownMenu } from './DropdownMenu.macos.tsrx'
import { Button } from './controls.macos.tsrx'
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
	const label=props.label??'More options'
	const button={ label, icon, variant: props.variant ?? 'ghost', size: props.size, isDisabled: props.isDisabled, tooltip: label, isIconOnly: true, className: 'vx-more-menu-trigger' } as const

	@if (presentation === 'bottom-sheet' || presentation === 'adaptive') {
		<>
		<Button {...button} id={props.id} style={props.style} clickAction={()=>setOpen(!open)}/>
			<BottomSheet isOpen={open} onOpenChange={setOpen} label={props.label??'More options'} snapPoints={[0.5,1]} className="vx-more-menu-sheet"><masonview className="vx-more-menu-sheet-list" style={{display: "flex"}}>{props.items.map(item=><MenuItemView key={item.key} className={cx('vx-menu-item',item.isDisabled&&'vx-menu-item--disabled')} disabled={item.isDisabled} onPress={()=>{if(item.isDisabled)return;setOpen(false);item.onSelect?.()}}>{item.icon?<Icon name={item.icon}/>:null}<label text={item.label??''}/></MenuItemView>)}</masonview></BottomSheet>
		</>
	} @else {
		<DropdownMenu id={props.id} className={props.className} style={props.style} items={props.items} isDisabled={props.isDisabled} isOpen={open} onOpenChange={setOpen} placement={popoverPlacement(props.placement)} alignment={props.alignment} label={label} hasChevron={false} button={button}/>
	}
}
