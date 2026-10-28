/** @jsxImportSource @octane-xplat/jsx/dom */
import { act, createRoot } from 'octane'
import { expect, it } from 'vitest'
import { Lightbox } from './index.web'

it('thumbnail selection navigates and updates the current accessible item', () => {
	const container = document.createElement('div')
	document.body.appendChild(container)
	const root = createRoot(container)
	try {
		act(() => root.render(
			<Lightbox.Root media={[{ src: 'first.jpg', alt: 'First' }, { src: 'second.jpg', alt: 'Second' }]}>
				<Lightbox.Thumbnails>
					<Lightbox.Thumbnail index={0}>First</Lightbox.Thumbnail>
					<Lightbox.Thumbnail index={1}>Second</Lightbox.Thumbnail>
					<Lightbox.ThumbnailIndicator />
				</Lightbox.Thumbnails>
			</Lightbox.Root>,
		))
		const buttons = container.querySelectorAll<HTMLButtonElement>('[data-lightbox-thumbnail]')
		expect(buttons[0]?.getAttribute('aria-current')).toBe('true')
		expect(buttons[1]?.getAttribute('aria-label')).toBe('Show image 2')
		act(() => buttons[1]!.click())
		expect(buttons[0]?.hasAttribute('aria-current')).toBe(false)
		expect(buttons[1]?.getAttribute('aria-current')).toBe('true')
		expect(container.querySelector('.vx-lightbox-thumbnail-indicator')?.getAttribute('aria-hidden')).toBe('true')
	} finally {
		act(() => root.render(null))
		container.remove()
	}
})
