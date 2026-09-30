// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { Pressable } from './Pressable.web.tsrx'
const roots: any[] = []
function mount(props: any = {}) {
 vi.useFakeTimers()
 const el = document.createElement('div');document.body.append(el);const root=createRoot(el);roots.push(root)
 const render = (next:any={}) => act(() => root.render(<Pressable {...props} {...next} />))
 render();const pointer=(type:string) => act(() => el.firstElementChild!.dispatchEvent(new Event(type,{bubbles:true})))
 const advance=() => act(() => vi.advanceTimersByTime(500))
 return {root,render,pointer,advance}
}
afterEach(() => {for (const root of roots.splice(0)) act(() => root.unmount());document.body.innerHTML='';vi.useRealTimers()})
it.each(['pointerup','pointerleave','pointercancel'])('cancels on %s after a rerender', (event) => {
 const callback=vi.fn();const {render,pointer,advance}=mount({onLongPress:callback})
 pointer('pointerdown');render({className:'updated'});pointer(event);advance();expect(callback).not.toHaveBeenCalled()
})
it('cancels on unmount', () => {
 const callback=vi.fn();const {root,pointer,advance}=mount({onLongPress:callback});pointer('pointerdown');act(() => root.unmount());advance();expect(callback).not.toHaveBeenCalled()
})
it.each([{disabled:true},{onLongPress:undefined}])('cancels when long press becomes unavailable (%j)', (next) => {
 const callback=vi.fn();const {render,pointer,advance}=mount({onLongPress:callback});pointer('pointerdown');render(next);advance();expect(callback).not.toHaveBeenCalled()
})
it('reports one long press through the latest callback', () => {
 const old=vi.fn(),current=vi.fn();const {render,pointer,advance}=mount({onLongPress:old});pointer('pointerdown');render({onLongPress:current});advance();advance()
 expect(old).not.toHaveBeenCalled();expect(current).toHaveBeenCalledTimes(1)
})
it('does not start a disabled long press', () => {
 const callback=vi.fn();const {pointer,advance}=mount({onLongPress:callback,disabled:true});pointer('pointerdown');advance();expect(callback).not.toHaveBeenCalled()
})
