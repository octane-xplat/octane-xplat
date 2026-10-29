/** @jsxImportSource @octane-xplat/jsx */
import {useRef,useState,useEffect} from 'octane'
import {Screen} from '../../../packages/ui/src/components/layout/Screen.tsrx'
import {View} from '../../../packages/ui/src/components/layout/View.tsrx'
import {Popover} from '../../../packages/ui/src/components/overlays/Popover.tsrx'
export function WindowsUICase() @{
 const anchor=useRef<any>(null);const [open,setOpen]=useState(false);
 useEffect(()=>{const t=setTimeout(()=>setOpen(true),1000);return()=>clearTimeout(t)},[]);

 <Screen><View style={{width:300,height:240}}>
  <label ref={(v:any)=>anchor.current=v} text="Windows anchor" width={100} height={20}/>
  <label text="Outside target" height={120}/>
  <Popover anchor={anchor} open={open} placement="bottom" onDismiss={()=>{console.log('[priority-popover] dismissed');setOpen(false)}}><label id="popover-label" text="Popover content" width={120} height={30}/></Popover>
 </View></Screen>
}
