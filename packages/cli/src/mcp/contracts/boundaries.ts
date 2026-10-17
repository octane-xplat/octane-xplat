// Product boundaries — see boundaries.d.ts.

export const PRODUCT_BOUNDARIES = [
	'Complements the agent\u2019s editing tools; not an autonomous code editor or a deployment system.',
	'No arbitrary shell execution and no arbitrary runtime expression evaluation.',
	'No universal component ownership tree, hook/signal inspection, or framework-wide profiling API.',
	'No cloud code indexing by default; local retrieval first, remote embeddings only by explicit opt-in.',
	'No app-store operations, production deployment, or credential management.',
	'Screenshot capture and visual analysis require explicit per-task approval; a UI task alone does not authorize them.',
	'Handler-dispatch and DOM-event results are never presented as OS-input verification.',
	'Device installation and destructive reset are not implied by launch permission.',
]
