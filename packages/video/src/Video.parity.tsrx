// Measured parity fixtures — assertions live in Video.parity.check.ts.
import { Video } from './Video'
import type { ParityFixture } from '@octane-xplat/ui/parity'

// Inline raster keeps the fixture independent of file/network loading.
const PARITY_IMAGE_SRC =
	'data:image/png;base64,' +
	'iVBORw0KGgoAAAANSUhEUgAAABAAAAAMCAYAAABr5z2BAAAAF0lEQVR4nGO4e/fuf0oww6gBowYMDwMA/TSwn5QGNeIAAAAASUVORK5CYII='

function VideoFixture() @{
	// Only the shared host frame and self-drawn chrome are under test here.
	<Video
		className="parity-video-root"
		style={{ width: 220, height: 124, backgroundColor: '#000000' }}
		src="about:blank"
		poster={PARITY_IMAGE_SRC}
		muted={true}
		controls={true}
	/>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'video-hosted-frame',
		component: 'Video',
		renderer: VideoFixture,
		props: {},
		height: 164,
	},
]
