// Measured parity fixtures — assertions live in Image.parity.check.ts.
import { Image } from './Image'
import type { ParityFixture } from './parity'

// Inline raster keeps the fixture independent of file/network loading.
const PARITY_IMAGE_SRC =
	'data:image/png;base64,' +
	'iVBORw0KGgoAAAANSUhEUgAAABAAAAAMCAYAAABr5z2BAAAAF0lEQVR4nGO4e/fuf0oww6gBowYMDwMA/TSwn5QGNeIAAAAASUVORK5CYII='

function ImageFixture() @{
	<Image
		className="parity-image-root"
		style={{ width: 80, height: 48 }}
		src={PARITY_IMAGE_SRC}
		alt="Parity fixture"
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'image-inline-data', component: 'Image', renderer: ImageFixture, props: {} },
]
