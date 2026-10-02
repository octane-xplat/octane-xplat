// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { createRoot, act } from 'octane'
import { AvatarGroup } from './AvatarGroup.web.tsrx'
import { MetadataList } from './MetadataList.web.tsrx'

function Collections() @{
 <><AvatarGroup id="avatars" max={2}><span>A</span><span>B</span><span>C</span></AvatarGroup><MetadataList id="metadata" maxNumOfItems={1}><span>First</span><span>Second</span></MetadataList></>
}

it('normalizes ordinary web JSX siblings for collection limits', () => {
 const host = document.createElement('div')
 const root = createRoot(host)
 act(() => root.render(<Collections/>))
 expect(host.querySelector('#avatars')?.textContent).toBe('AB+1')
 expect(host.querySelector('#metadata')?.textContent).toContain('First')
 expect(host.querySelector('#metadata')?.textContent).not.toContain('Second')
 act(() => root.unmount())
})
