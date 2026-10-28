/** @jsxImportSource @octane-xplat/jsx/dom */
import { createRoot } from 'octane'
import { Lightbox } from '../../src/index.web'

const items = [
	{ src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect fill="%23a33"/></svg>', alt: 'red', width: 800, height: 600 },
	{ src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect fill="%233a3"/></svg>', alt: 'green', width: 600, height: 600 },
	{ src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="300"><rect fill="%23337"/></svg>', alt: 'blue', width: 900, height: 300 },
]

function App() {
	return (
		<div>
			<Lightbox.Root media={items}>
				{items.map((it, i) => (
					<Lightbox.Trigger key={i} index={i} id={`thumb-${i}`} className="thumb" style={{ padding: 0, border: 0, background: 'none' }}>
						<img src={it.src} alt={it.alt} style={{ display: 'block', width: 160, height: 90, objectFit: 'cover', marginRight: 10 }} />
					</Lightbox.Trigger>
				))}
				<Lightbox.Backdrop style={{ background: 'rgba(0,0,0,0.85)' }} />
				<Lightbox.Popup>
					<Lightbox.Viewport />
					<Lightbox.Close className="fx-close">×</Lightbox.Close>
					<Lightbox.Prev className="fx-prev">‹</Lightbox.Prev>
					<Lightbox.Next className="fx-next">›</Lightbox.Next>
					<Lightbox.Thumbnails style={{ position: 'absolute', left: 0, bottom: 0, width: 120, height: 50, gap: 10 }}>
						{items.map((item, index) => (
							<Lightbox.Thumbnail key={index} index={index} style={{ width: 40 + index * 20, height: 40, padding: 0, border: 0 }}>
								{item.alt}
							</Lightbox.Thumbnail>
						))}
						<Lightbox.ThumbnailIndicator style={{ border: '2px solid white', boxSizing: 'border-box' }} />
					</Lightbox.Thumbnails>
				</Lightbox.Popup>
			</Lightbox.Root>
		</div>
	)
}

createRoot(document.getElementById('root')!).render(<App />)
