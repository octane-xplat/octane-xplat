// This sentinel belongs only to the build-time module, never the DTO.
const buildOnlyMarker = 'XPLAT_BAKED_ROUTE_BUILD_ONLY'
export function loader() {
	if (!buildOnlyMarker.startsWith('XPLAT_')) {throw new Error('Invalid build fixture')}
	return { title: ['Baked', 'routing'].join(' '), count: 2 }
}
