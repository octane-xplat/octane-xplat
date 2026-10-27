/** @jsxImportSource octane/web */
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
					<Lightbox.Close style={{ position: 'fixed', top: 10, right: 10, zIndex: 10 }}>×</Lightbox.Close>
					<Lightbox.Prev style={{ position: 'fixed', left: 10, top: '50%', zIndex: 10 }}>‹</Lightbox.Prev>
					<Lightbox.Next style={{ position: 'fixed', right: 10, top: '50%', zIndex: 10 }}>›</Lightbox.Next>
				</Lightbox.Popup>
			</Lightbox.Root>
		</div>
	)
}

createRoot(document.getElementById('root')!).render(<App />)
