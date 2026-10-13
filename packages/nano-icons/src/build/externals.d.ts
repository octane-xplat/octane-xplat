// Engine declarations not shipped by the packages themselves.
declare module 'cubic2quad' {
	/** Subdivides a cubic bezier into quadratic segments within `errorBound`. Returns a flat point array. */
	function cubic2quad(
		p1x: number,
		p1y: number,
		c1x: number,
		c1y: number,
		c2x: number,
		c2y: number,
		p2x: number,
		p2y: number,
		errorBound: number,
	): number[]

	export default cubic2quad
}
