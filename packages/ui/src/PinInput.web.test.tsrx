// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { PinInput } from './PinInput.web.tsrx'
const roots:any[]=[]
function mount(props:any={}) {
 const el=document.createElement('div');document.body.append(el);const root=createRoot(el);roots.push(root)
 const render=(next:any={}) => act(() => root.render(<PinInput {...props} {...next} />));render()
 const inputs=() => Array.from(el.querySelectorAll('input'))
 const enter=(i:number,value:string) => {const field=inputs()[i];field.value=value;act(() => field.dispatchEvent(new Event('input',{bubbles:true})))}
 return {render,inputs,enter}
}
afterEach(() => {for (const root of roots.splice(0)) act(() => root.unmount());document.body.innerHTML=''})
it('clears the edited cell and suffix of a controlled PIN', () => {
 const change=vi.fn(),complete=vi.fn();const {enter}=mount({value:'1234',onValueChange:change,onComplete:complete});enter(1,'')
 expect(change).toHaveBeenCalledWith('1');expect(complete).not.toHaveBeenCalled()
})
it('keeps editing contiguous and advances focus through an uncontrolled PIN', () => {
 const change=vi.fn(),complete=vi.fn();const {inputs,enter}=mount({onValueChange:change,onComplete:complete})
 expect(inputs().map(i => i.readOnly)).toEqual([false,true,true,true])
 for (let i=0;i<4;i++) {enter(i,String(i+1));if (i<3) expect(document.activeElement).toBe(inputs()[i+1])}
 expect(inputs().map(i=>i.value)).toEqual(['1','2','3','4']);expect(complete).toHaveBeenCalledTimes(1);expect(complete).toHaveBeenCalledWith('1234')
 enter(1,'');expect(inputs().map(i=>i.value)).toEqual(['1','','','']);expect(change).toHaveBeenLastCalledWith('1')
 enter(1,'5');expect(document.activeElement).toBe(inputs()[2]);expect(inputs().map(i=>i.value)).toEqual(['1','5','',''])
 expect(complete).toHaveBeenCalledTimes(1)
})
it('replaces a filled cell without shifting later cells', () => {
 const change=vi.fn(),complete=vi.fn();const {enter}=mount({value:'1234',onValueChange:change,onComplete:complete});enter(1,'29')
 expect(change).toHaveBeenCalledWith('1934');expect(complete).toHaveBeenCalledWith('1934')
})
it('does not relocate input from a later empty cell to the beginning', () => {
 const change=vi.fn();const {enter}=mount({onValueChange:change});enter(3,'9');expect(change).not.toHaveBeenCalled()
})
it('respects disabled cells and controlled updates', () => {
 const {render,inputs}=mount({value:'1234',disabled:true});expect(inputs().every(i=>i.readOnly)).toBe(true)
 render({value:'12',disabled:false});expect(inputs().map(i=>i.value)).toEqual(['1','2','','']);expect(inputs().map(i=>i.readOnly)).toEqual([false,false,false,true])
})
