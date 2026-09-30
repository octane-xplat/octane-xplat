// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { TextArea } from './TextArea.web.tsrx'
const roots:any[]=[]
function mount(props:any={}) {
 const el=document.createElement('div');document.body.append(el);const root=createRoot(el);roots.push(root)
 let measured=20
 const render=(next:any={}) => act(() => root.render(<TextArea {...props} style={{fontSize:10,lineHeight:"10px",padding:0,borderWidth:0,boxSizing:'border-box'}} {...next} />));
 const descriptor=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'scrollHeight')
 Object.defineProperty(HTMLTextAreaElement.prototype,'scrollHeight',{configurable:true,get:() => measured})
 render();const field=el.querySelector('textarea')!
 const input=(value:string,height:number) => {measured=height;field.value=value;act(() => field.dispatchEvent(new Event('input',{bubbles:true})))}
 const measure=(height:number) => {measured=height}
 return {field,render,input,measure,restore:() => {if(descriptor) Object.defineProperty(HTMLTextAreaElement.prototype,'scrollHeight',descriptor);else delete (HTMLTextAreaElement.prototype as any).scrollHeight}}
}

const restorers:(() => void)[]=[]
afterEach(() => {for(const root of roots.splice(0)) act(() => root.unmount());for(const restore of restorers.splice(0)) restore();document.body.innerHTML='';vi.restoreAllMocks()})
it('grows and shrinks an uncontrolled field from actual input', () => {
 const onChange=vi.fn();const m=mount({autoGrow:true,onChange});restorers.push(m.restore)
 m.input('one\ntwo\nthree',80);expect(m.field.style.height).toBe('80px');expect(onChange).toHaveBeenCalledWith('one\ntwo\nthree')
 m.input('one',20);expect(m.field.style.height).toBe('20px');expect(m.field.style.overflowY).toBe('hidden')
})

it('caps uncontrolled growth at maxRows and scrolls past the cap', () => {
 const m=mount({autoGrow:true,rows:2,maxRows:3});restorers.push(m.restore)
 expect(m.field.rows).toBe(2);m.input('many lines',80);expect(m.field.style.height).toBe('30px');expect(m.field.style.overflowY).toBe('auto')
 m.input('short',20);expect(m.field.style.height).toBe('20px');expect(m.field.style.overflowY).toBe('hidden')
})

it('still fits controlled value updates', () => {
 const m=mount({autoGrow:true,value:'one'});restorers.push(m.restore);m.measure(70);m.render({value:'one\ntwo\nthree'})
 expect(m.field.style.height).toBe('70px');expect(m.field.value).toBe('one\ntwo\nthree')
})

it('leaves fixed-row inputs at their declared rows', () => {
 const m=mount({rows:4});restorers.push(m.restore);m.input('many lines',80);expect(m.field.rows).toBe(4);expect(m.field.style.height).toBe('')
})
