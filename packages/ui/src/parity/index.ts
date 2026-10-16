// Shared parity fixture contract — <Component>.parity.tsrx files across the
// workspace export a PARITY: ParityFixture[] consumed by the harness app's
// single import.meta.glob registry (packages/app/src/parity/index.ts).

/** One measured fixture cell on the /parity stage. */
export interface ParityFixture {
	name: string
	/** The shared component this fixture measures; child helpers are not counted. */
	component: string
	/** A top-level universal component; fixture data arrives through props. */
	renderer: (props: any) => any
	props: Record<string, any>
	/** Fill context: the stage box keeps align-items:stretch so the
	 *  fixture measures as it would inside a default column. Intrinsic
	 *  fixtures (fixed-width roots like Switch) get align-items:flex-start
	 *  instead — NS stretch clobbers explicit width where web doesn't. */
	wide?: boolean
	/** Override the default 64-dip fixture box height. */
	height?: number
	/** Override the default box width for long, unwrapped text measurements. */
	width?: number
}
