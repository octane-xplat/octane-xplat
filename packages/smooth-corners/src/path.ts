/** Shared smooth-corner path generation — pure TS, no DOM. Emits one
 *  `PathCommand[]` (absolute coords, arcs already center-parameterized) that
 *  web stringifies to `d`, iOS feeds `CGPathAdd*`, Android feeds
 *  `android.graphics.Path`, and macOS feeds `NSBezierPath`.
 *
 *  Lisse curves (`squircle`/`superellipse`/`clothoid`/`arc`) delegate to
 *  `@lisse/core/path`; `continuous` is our own builder — the Rosenfeld
 *  `UIBezierPath` constants reproducing Apple's fixed continuous corner
 *  (~0.25 px from SwiftUI `.continuous`; Lisse issue #103 /
 *  tools/apple-continuous-export). */
import {
	distributeAndNormalize,
	generatePath as lisseGeneratePath,
	getCurveBuilder,
	DEFAULT_EXPONENT,
	DEFAULT_PRESERVE_SMOOTHING,
	DEFAULT_SMOOTHING,
} from '@lisse/core/path';

import type { CurveBuilder, CurveBuilderInput } from '@lisse/core/path';
import type {
	CornerConfig,
	CornerCurve,
	CornerOptions,
	PerCornerConfig,
} from './props';

export type PathCommand =
	| { c: 'M' | 'L'; x: number; y: number }
	| { c: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
	| {
			c: 'A';
			/** Center-parameterized circular arc: degrees, SVG y-down convention
			 *  (0 = +x axis, positive sweep = visually clockwise). */
			cx: number;
			cy: number;
			r: number;
			startDeg: number;
			sweepDeg: number;
			x: number;
			y: number;
	  }
	| { c: 'Z' };

const ORIENTS = ['TL', 'TR', 'BR', 'BL'] as const;
type Orient = (typeof ORIENTS)[number];

interface Resolved {
	radius: number;
	curve: CornerCurve;
	smoothing: number;
	exponent: number;
	preserveSmoothing: boolean;
}

interface Corners {
	topLeft: Resolved;
	topRight: Resolved;
	bottomRight: Resolved;
	bottomLeft: Resolved;
}

function resolveOne(c: CornerConfig | number | undefined): Resolved {
	const cfg: CornerConfig = typeof c === 'number' ? { radius: c } : c ?? { radius: 0 };
	return {
		radius: cfg.radius,
		curve: cfg.curve ?? 'continuous',
		smoothing: cfg.smoothing ?? DEFAULT_SMOOTHING,
		exponent: cfg.exponent ?? DEFAULT_EXPONENT,
		preserveSmoothing: cfg.preserveSmoothing ?? DEFAULT_PRESERVE_SMOOTHING,
	};
}

function resolveOptions(options: CornerOptions): Corners {
	if (typeof options === 'number') {
		const c = resolveOne(options);
		return { topLeft: c, topRight: c, bottomRight: c, bottomLeft: c };
	}

	if ('radius' in options) {
		const c = resolveOne(options);
		return { topLeft: c, topRight: c, bottomRight: c, bottomLeft: c };
	}

	const p = options as PerCornerConfig;
	return {
		topLeft: resolveOne(p.topLeft),
		topRight: resolveOne(p.topRight),
		bottomRight: resolveOne(p.bottomRight),
		bottomLeft: resolveOne(p.bottomLeft),
	};
}

// --- continuous (Rosenfeld / Apple UIBezierPath) ----------------------------

/** Shoulder extent along each adjacent edge, as a multiple of R. */
const CONT_P = 1.528665;
// Cubic triple per corner, offsets as multiples of R in the corner frame:
// x = inward distance along the edge perpendicular to the corner's "height"
// axis — concretely f(x,y) = vertex + x·(inwardX) + y·(inwardY), with the
// sequence traversed x-descending on horizontal-entry corners (TR, BL) and
// y-descending on vertical-entry corners (BR, TL). See
// Lisse tools/apple-continuous-export/ExportRosenfeld.swift.
const CONT_CURVE: ReadonlyArray<readonly [number, number]> = [
	[1.08849296, 0.0],
	[0.86840694, 0.0],
	[0.63149379, 0.07491139],
	[0.37282383, 0.16905956],
	[0.16905956, 0.37282383],
	[0.07491139, 0.63149379],
	[0.0, 0.86840694],
	[0.0, 1.08849296],
	[0.0, 1.52866498],
];

const CONT_CURVE_YX: ReadonlyArray<readonly [number, number]> =
	CONT_CURVE.map(([x, y]) => [y, x] as const);

/** Absolute `C` commands for one continuous corner. `p` returned separately —
 *  the tangent distance from the vertex along the incoming edge. */
function continuousCorner(
	w: number,
	h: number,
	radius: number,
	budget: number,
	orient: Orient,
): { p: number; cmds: PathCommand[] } {
	// The shoulder extends past R; shrink R so it fits the edge budget
	// (mirrors how UIBezierPath scales when adjacent corners compete).
	const r = Math.min(radius, budget / CONT_P);
	const p = CONT_P * r;
	if (r <= 0) {return { p: 0, cmds: [] };}

	// Corner frame: (fx, fy) maps the (x,y) coefficient table to canvas
	// coordinates; `seq` selects traversal direction.
	let fx: (x: number, y: number) => number;
	let fy: (x: number, y: number) => number;
	let seq = CONT_CURVE;
	switch (orient) {
		case 'TR':
			fx = (x, _y) => w - x * r;
			fy = (_x, y) => y * r;
			break;
		case 'BR':
			fx = (x, _y) => w - x * r;
			fy = (_x, y) => h - y * r;
			seq = CONT_CURVE_YX;
			break;
		case 'BL':
			fx = (x, _y) => x * r;
			fy = (_x, y) => h - y * r;
			break;
		case 'TL':
			fx = (x, _y) => x * r;
			fy = (_x, y) => 0 + y * r;
			seq = CONT_CURVE_YX;
			break;
	}

	const cmds: PathCommand[] = [];
	for (let i = 0; i < seq.length; i += 3) {
		const [c1, c2, e] = [seq[i], seq[i + 1], seq[i + 2]];
		cmds.push({
			c: 'C',
			x1: fx(c1[0], c1[1]),
			y1: fy(c1[0], c1[1]),
			x2: fx(c2[0], c2[1]),
			y2: fy(c2[0], c2[1]),
			x: fx(e[0], e[1]),
			y: fy(e[0], e[1]),
		});
	}

	return { p, cmds };
}

// --- lisse corner → commands -----------------------------------------------

/** Parse a curve builder's per-orient relative segment starting at `pen`.
 *  Returns absolute commands. Lisse segments only emit `c`/`a`/`l`. */
function segmentCommands(seg: string, pen: { x: number; y: number }): PathCommand[] {
	const cmds = parsePath(seg, pen.x, pen.y);
	// Drop a leading implicit M — the segment continues the pen in place.
	return cmds.filter((c) => c.c !== 'M');
}

// --- SVG d parsing ----------------------------------------------------------

const TOKEN = /[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;
const ARITY: Record<string, number> = {
	M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0,
};

/** Endpoint→center for a circular SVG arc (φ=0 — every Lisse emitter).
 *  Non-circular or rotated arcs throw: unsupported is loud, not silent. */
function arcToCenter(
	x0: number,
	y0: number,
	rx: number,
	ry: number,
	rot: number,
	largeArc: number,
	sweep: number,
	x1: number,
	y1: number,
): Extract<PathCommand, { c: 'A' }> | null {
	if (x0 === x1 && y0 === y1) {return null;}
	if (rx <= 0 || ry <= 0) {
		return null;
	}

	if (rx !== ry || rot !== 0) {
		throw new Error(`smooth-corners: only circular unrotated arcs are supported (got a ${rx} ${ry} ${rot})`);
	}

	const dx = (x0 - x1) / 2;
	const dy = (y0 - y1) / 2;
	const d2 = dx * dx + dy * dy;
	let r = rx;
	// Expand r when the endpoints don't fit (spec F.6.4 step 2).
	const lambda = d2 / (r * r);
	if (lambda > 1) {r *= Math.sqrt(lambda);}

	// Center offset perpendicular to the chord; sign per fa/fs
	// (spec F.6.5: cx' = coef·y1', cy' = −coef·x1' for φ=0).
	const h = Math.sqrt(Math.max(0, (r * r - d2) / d2));
	const sign = largeArc !== sweep ? 1 : -1;
	const cx = (x0 + x1) / 2 + sign * h * dy;
	const cy = (y0 + y1) / 2 - sign * h * dx;

	const deg = (v: number) => (v * 180) / Math.PI;
	const start = deg(Math.atan2(y0 - cy, x0 - cx));
	const end = deg(Math.atan2(y1 - cy, x1 - cx));
	let sweepDeg = end - start;
	if (sweep && sweepDeg <= 0) {sweepDeg += 360;}
	if (!sweep && sweepDeg >= 0) {sweepDeg -= 360;}
	return { c: 'A', cx, cy, r, startDeg: start, sweepDeg, x: x1, y: y1 };
}

/** Parse an SVG `d` string (or relative corner segment) into absolute
 *  `PathCommand[]`. Supports M L H V C S Q T A Z; `pen` seeds relative
 *  commands when parsing a mid-path segment. */
export function parsePath(d: string, penX = 0, penY = 0): PathCommand[] {
	const tokens = d.match(TOKEN) ?? [];
	const out: PathCommand[] = [];
	let i = 0;
	let cmd = '';
	let px = penX;
	let py = penY;
	let sx = penX; // subpath start for Z
	let sy = penY;

	const num = (): number => {
		const t = tokens[i++];
		const n = Number(t);
		if (!Number.isFinite(n)) {throw new Error(`smooth-corners: bad path token '${t}' in '${d}'`);}
		return n;
	};

	while (i < tokens.length) {
		const t = tokens[i];
		if (/[a-zA-Z]/.test(t)) {
			cmd = t;
			i++;
			if (cmd === 'Z' || cmd === 'z') {
				out.push({ c: 'Z' });
				px = sx;
				py = sy;
				continue;
			}
		}

		if (!cmd) {throw new Error(`smooth-corners: path data missing command: '${d}'`);}
		const rel = cmd === cmd.toLowerCase();
		const upper = cmd.toUpperCase();
		const arity = ARITY[upper];
		if (arity === undefined) {throw new Error(`smooth-corners: unsupported path command '${cmd}'`);}
		if (upper === 'S' || upper === 'Q' || upper === 'T') {
			throw new Error(`smooth-corners: '${upper}' commands are not supported`);
		}

		switch (upper) {
			case 'M': {
				const x = num() + (rel ? px : 0);
				const y = num() + (rel ? py : 0);
				out.push({ c: 'M', x, y });
				px = sx = x;
				py = sy = y;
				cmd = rel ? 'l' : 'L'; // subsequent pairs are lines
				break;
			}
			case 'L': {
				const x = num() + (rel ? px : 0);
				const y = num() + (rel ? py : 0);
				out.push({ c: 'L', x, y });
				px = x;
				py = y;
				break;
			}
			case 'H': {
				const x = num() + (rel ? px : 0);
				out.push({ c: 'L', x, y: py });
				px = x;
				break;
			}
			case 'V': {
				const y = num() + (rel ? py : 0);
				out.push({ c: 'L', x: px, y });
				py = y;
				break;
			}
			case 'C': {
				const x1 = num() + (rel ? px : 0);
				const y1 = num() + (rel ? py : 0);
				const x2 = num() + (rel ? px : 0);
				const y2 = num() + (rel ? py : 0);
				const x = num() + (rel ? px : 0);
				const y = num() + (rel ? py : 0);
				out.push({ c: 'C', x1, y1, x2, y2, x, y });
				px = x;
				py = y;
				break;
			}
			case 'A': {
				const rx = num();
				const ry = num();
				const rot = num();
				const fa = num();
				const fs = num();
				const x = num() + (rel ? px : 0);
				const y = num() + (rel ? py : 0);
				const arc = arcToCenter(px, py, rx, ry, rot, fa, fs, x, y);
				if (arc) {out.push(arc);}
				else {out.push({ c: 'L', x, y });}

				px = x;
				py = y;
				break;
			}
		}
	}

	return out;
}

// --- stitching ---------------------------------------------------------------

function lisseCornerSeg(
	corner: Resolved,
	radius: number,
	budget: number,
	orient: Orient,
	pen: { x: number; y: number },
): { p: number; cmds: PathCommand[] } {
	const builder: CurveBuilder = getCurveBuilder(corner.curve as never);
	const input: CurveBuilderInput = {
		cornerRadius: radius,
		smoothing: corner.smoothing,
		exponent: corner.exponent,
		preserveSmoothing: corner.preserveSmoothing,
		roundingAndSmoothingBudget: budget,
	};

	const out = builder(input);
	return { p: out.p, cmds: segmentCommands(out.pathSegment(orient as never), pen) };
}

function cornerCmds(
	corner: Resolved,
	normalized: { radius: number; roundingAndSmoothingBudget: number },
	orient: Orient,
	pen: { x: number; y: number },
	w: number,
	h: number,
): { p: number; cmds: PathCommand[] } {
	if (corner.curve === 'continuous') {
		return continuousCorner(w, h, normalized.radius, normalized.roundingAndSmoothingBudget, orient);
	}

	return lisseCornerSeg(corner, normalized.radius, normalized.roundingAndSmoothingBudget, orient, pen);
}

const RECT: PathCommand[] = [
	{ c: 'M', x: 0, y: 0 },
	{ c: 'L', x: 0, y: 0 },
	{ c: 'L', x: 0, y: 0 },
	{ c: 'L', x: 0, y: 0 },
	{ c: 'Z' },
];

/** Absolute command list for the smooth-cornered rect. When no corner uses
 *  `continuous`, delegates to `@lisse/core` `generatePath` (keeping its
 *  capsule/blend fast paths) and parses the result; otherwise stitches
 *  per-corner segments itself (per-corner mixing with `continuous`). */
export function generateCommands(
	width: number,
	height: number,
	options: CornerOptions,
): PathCommand[] {
	if (width <= 0 || height <= 0) {return RECT;}
	const corners = resolveOptions(options);
	const anyContinuous =
		corners.topLeft.curve === 'continuous' ||
		corners.topRight.curve === 'continuous' ||
		corners.bottomRight.curve === 'continuous' ||
		corners.bottomLeft.curve === 'continuous';

	if (!anyContinuous) {
		return parsePath(lisseGeneratePath(width, height, lisseOptions(corners)));
	}

	const normalized = distributeAndNormalize({
		topLeftCornerRadius: corners.topLeft.radius,
		topRightCornerRadius: corners.topRight.radius,
		bottomRightCornerRadius: corners.bottomRight.radius,
		bottomLeftCornerRadius: corners.bottomLeft.radius,
		width,
		height,
	});

	// Walk clockwise from the top edge. `pen` tracks the last emitted point.
	const emit = (
		corner: Resolved,
		n: { radius: number; roundingAndSmoothingBudget: number },
		orient: Orient,
		entryX: number,
		entryY: number,
	) => cornerCmds(corner, n, orient, { x: entryX, y: entryY }, width, height);

	// First pass to learn each corner's p so edge lines land correctly.
	const pTL = previewP(corners.topLeft, normalized.topLeft, 'TL', width, height);
	const pTR = previewP(corners.topRight, normalized.topRight, 'TR', width, height);
	const pBR = previewP(corners.bottomRight, normalized.bottomRight, 'BR', width, height);
	const pBL = previewP(corners.bottomLeft, normalized.bottomLeft, 'BL', width, height);

	const out: PathCommand[] = [{ c: 'M', x: pTL, y: 0 }];
	out.push({ c: 'L', x: width - pTR, y: 0 });
	const tr = emit(corners.topRight, normalized.topRight, 'TR', width - pTR, 0);
	out.push(...tr.cmds);
	out.push({ c: 'L', x: width, y: height - pBR });
	const br = emit(corners.bottomRight, normalized.bottomRight, 'BR', width, height - pBR);
	out.push(...br.cmds);
	out.push({ c: 'L', x: pBL, y: height });
	const bl = emit(corners.bottomLeft, normalized.bottomLeft, 'BL', pBL, height);
	out.push(...bl.cmds);
	out.push({ c: 'L', x: 0, y: pTL });
	const tl = emit(corners.topLeft, normalized.topLeft, 'TL', 0, pTL);
	out.push(...tl.cmds);
	out.push({ c: 'Z' });
	return out;
}

/** A corner's tangent distance without emitting commands (cheap for
 *  continuous; re-runs the lisse builder for other curves — called once per
 *  frame per corner, acceptable). */
function previewP(
	corner: Resolved,
	n: { radius: number; roundingAndSmoothingBudget: number },
	orient: Orient,
	w: number,
	h: number,
): number {
	return cornerCmds(corner, n, orient, { x: 0, y: 0 }, w, h).p;
}

// 'continuous' is ours, not a lisse CurveType — cast it away per field; the
// continuous fast-path never reaches this function.
function lisseOptions(corners: Corners): Parameters<typeof lisseGeneratePath>[2] {
	const { topLeft: a, topRight: b, bottomRight: c, bottomLeft: d } = corners;
	const same =
		a.radius === b.radius && a.radius === c.radius && a.radius === d.radius &&
		a.curve === b.curve && a.curve === c.curve && a.curve === d.curve &&
		a.smoothing === b.smoothing && a.smoothing === c.smoothing && a.smoothing === d.smoothing &&
		a.exponent === b.exponent && a.exponent === c.exponent && a.exponent === d.exponent &&
		a.preserveSmoothing === b.preserveSmoothing &&
		a.preserveSmoothing === c.preserveSmoothing &&
		a.preserveSmoothing === d.preserveSmoothing;

	if (same) {
		return {
			radius: a.radius,
			curve: a.curve as never,
			smoothing: a.smoothing,
			exponent: a.exponent,
			preserveSmoothing: a.preserveSmoothing,
		};
	}

	const per = (c: Resolved) => ({
		radius: c.radius,
		curve: c.curve as never,
		smoothing: c.smoothing,
		exponent: c.exponent,
		preserveSmoothing: c.preserveSmoothing,
	});

	return { topLeft: per(a), topRight: per(b), bottomRight: per(c), bottomLeft: per(d) };
}

// --- emitters ----------------------------------------------------------------

const f = (n: number) => Math.round(n * 1e4) / 1e4;

/** Serialize commands back to an SVG `d` (web `clip-path`, debug/tests). */
export function commandsToD(cmds: PathCommand[]): string {
	const parts: string[] = [];
	for (const c of cmds) {
		switch (c.c) {
			case 'M':
				parts.push(`M ${f(c.x)} ${f(c.y)}`);
				break;
			case 'L':
				parts.push(`L ${f(c.x)} ${f(c.y)}`);
				break;
			case 'C':
				parts.push(`C ${f(c.x1)} ${f(c.y1)} ${f(c.x2)} ${f(c.y2)} ${f(c.x)} ${f(c.y)}`);
				break;
			case 'A':
				// Re-emit as endpoint arc; largeArc when |sweep| > 180.
				parts.push(
					`A ${f(c.r)} ${f(c.r)} 0 ${Math.abs(c.sweepDeg) > 180 ? 1 : 0} ${c.sweepDeg >= 0 ? 1 : 0} ${f(c.x)} ${f(c.y)}`,
				);

				break;
			case 'Z':
				parts.push('Z');
				break;
		}
	}

	return parts.join(' ');
}

/** `d` for the smooth-cornered rect — Lisse's own string when no
 *  `continuous` corner is involved (byte-identical to upstream, incl.
 *  capsule/blend fast paths), our serialization otherwise. */
export function smoothPathD(width: number, height: number, options: CornerOptions): string {
	const corners = resolveOptions(options);
	const anyContinuous =
		corners.topLeft.curve === 'continuous' ||
		corners.topRight.curve === 'continuous' ||
		corners.bottomRight.curve === 'continuous' ||
		corners.bottomLeft.curve === 'continuous';

	if (!anyContinuous && width > 0 && height > 0) {
		return lisseGeneratePath(width, height, lisseOptions(corners));
	}

	return commandsToD(generateCommands(width, height, options));
}

/** Mirror a command list across the horizontal axis for a height-`h` box —
 *  AppKit's y-up layer coordinates need this (UIKit/Android Canvas are
 *  y-down like SVG). Arcs invert sweep; startDeg flips sign. */
export function flipCommandsY(cmds: PathCommand[], h: number): PathCommand[] {
	return cmds.map((c) => {
		switch (c.c) {
			case 'M':
			case 'L':
				return { c: c.c, x: c.x, y: h - c.y };
			case 'C':
				return { c: 'C', x1: c.x1, y1: h - c.y1, x2: c.x2, y2: h - c.y2, x: c.x, y: h - c.y };
			case 'A':
				return {
					c: 'A',
					cx: c.cx,
					cy: h - c.cy,
					r: c.r,
					startDeg: -c.startDeg,
					sweepDeg: -c.sweepDeg,
					x: c.x,
					y: h - c.y,
				};
			case 'Z':
				return c;
		}
	});
}
