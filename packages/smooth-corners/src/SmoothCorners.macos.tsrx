/** @jsxImportSource @octane-xplat/macos-renderer */
import { useCallback, useRef } from 'octane';
import { flipCommandsY, generateCommands } from './path';
import type { PathCommand } from './path';
import type { SmoothCornersProps } from './props';

declare const NSBezierPath: any;
declare const CAShapeLayer: any;
declare const NSColor: any;
declare const NSMakeSize: any;

/** '#rgb'/'#rrggbb'/'#rrggbbaa'/'rgba(r,g,b,a)' → NSColor. Keep the surface
 *  small — the AppKit target's CSS coverage is a curated subset anyway. */
function colorValue(input: string | undefined): any {
	if (!input) return NSColor.blackColor;
	const hex = input.trim();
	if (hex.startsWith('#')) {
		const h = hex.slice(1);
		const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
		const int = parseInt(n, 16);
		const hasAlpha = n.length === 8;
		const r = (int >> (hasAlpha ? 24 : 16)) & 0xff;
		const g = (int >> (hasAlpha ? 16 : 8)) & 0xff;
		const b = (int >> (hasAlpha ? 8 : 0)) & 0xff;
		const a = hasAlpha ? int & 0xff : 255;
		return NSColor.colorWithSRGBRedGreenBlueAlpha(r / 255, g / 255, b / 255, a / 255);
	}

	const m = hex.match(/^rgba?\(([^)]+)\)$/);
	if (m) {
		const [r, g, b, a = '1'] = m[1].split(',').map((s) => s.trim());
		return NSColor.colorWithSRGBRedGreenBlueAlpha(
			Number(r) / 255,
			Number(g) / 255,
			Number(b) / 255,
			Number(a),
		);
	}

	return NSColor.blackColor;
}

/** PathCommand[] → NSBezierPath. Commands are y-down (SVG); AppKit layer
 *  space is y-up unless the view is flipped — flip once here. */
function toNSBezierPath(cmds: PathCommand[], h: number): any {
	const flipped = flipCommandsY(cmds, h);
	const bp = NSBezierPath.bezierPath();
	for (const c of flipped) {
		switch (c.c) {
			case 'M':
				bp.moveToPoint({ x: c.x, y: c.y });
				break;
			case 'L':
				bp.lineToPoint({ x: c.x, y: c.y });
				break;
			case 'C':
				bp.curveToPointControlPoint1ControlPoint2(
					{ x: c.x, y: c.y },
					{ x: c.x1, y: c.y1 },
					{ x: c.x2, y: c.y2 },
				);

				break;
			case 'A':
				bp.appendBezierPathWithArcWithCenterRadiusStartAngleEndAngleClockwise(
					{ x: c.cx, y: c.cy },
					c.r,
					c.startDeg,
					c.startDeg + c.sweepDeg,
					c.sweepDeg > 0,
				);

				break;
			case 'Z':
				bp.closePath();
				break;
		}
	}

	return bp;
}

const MASK_KEY = '__smoothMask';
const BORDER_KEY = '__smoothBorder';

function applyInner(view: any, w: number, h: number, props: SmoothCornersProps): void {
	if (!view || w <= 0 || h <= 0) return;
	view.wantsLayer = true;
	const bp = toNSBezierPath(generateCommands(w, h, props.corners), h);

	let mask = view[MASK_KEY] as any;
	if (!mask) {
		mask = CAShapeLayer.new();
		view[MASK_KEY] = mask;
	}

	mask.path = bp.CGPath;
	view.layer.mask = mask;

	let borderLayer = view[BORDER_KEY] as any;
	const border = props.border;
	if (border && border.width > 0 && border.color) {
		if (!borderLayer) {
			borderLayer = CAShapeLayer.new();
			view[BORDER_KEY] = borderLayer;
			view.layer.addSublayer(borderLayer);
		}

		borderLayer.frame = view.layer.bounds;
		borderLayer.path = bp.CGPath;
		borderLayer.fillColor = null;
		borderLayer.strokeColor = colorValue(border.color).CGColor;
		borderLayer.lineWidth = border.width * 2;
	} else if (borderLayer) {
		borderLayer.removeFromSuperlayer();
		view[BORDER_KEY] = null;
	}
}

function applyOuter(view: any, w: number, h: number, props: SmoothCornersProps): void {
	if (!view) return;
	view.wantsLayer = true;
	const layer = view.layer;
	const shadow = props.shadow;
	if (!shadow || w <= 0 || h <= 0) {
		layer.shadowOpacity = 0;
		layer.shadowPath = null;
		return;
	}

	const spread = shadow.spread ?? 0;
	const gw = spread !== 0 ? w + spread * 2 : w;
	const gh = spread !== 0 ? h + spread * 2 : h;
	const bp = toNSBezierPath(generateCommands(gw, gh, props.corners), gh);
	layer.shadowPath = bp.CGPath;
	layer.shadowColor = colorValue(shadow.color).CGColor;
	layer.shadowOpacity = shadow.opacity ?? 0.35;
	layer.shadowRadius = shadow.blur ?? 0;
	const ox = shadow.offsetX ?? 0;
	// y-up shadow offsets invert vertically vs CSS.
	const oy = -(shadow.offsetY ?? 0);
	layer.shadowOffset = NSMakeSize
		? NSMakeSize(spread !== 0 ? -spread + ox : ox, spread !== 0 ? -spread + oy : oy)
		: { width: ox, height: oy };
}

/** SmoothCorners on the AppKit renderer — NSBezierPath → CAShapeLayer mask
 *  on the inner box; the outer view carries the drop shadow. */
export function SmoothCorners(props: SmoothCornersProps) @{
	const state = useRef<{ props: SmoothCornersProps }>({ props });
	state.current.props = props;

	// onLayoutChanged supplies {object: NSView, width, height} — the arranged
	// AppKit view directly; no ref dance needed.
	const innerLayout = useCallback(
		(e: any) => applyInner(e?.object, e?.width ?? 0, e?.height ?? 0, state.current.props),
		[],
	);

	const outerLayout = useCallback(
		(e: any) => applyOuter(e?.object, e?.width ?? 0, e?.height ?? 0, state.current.props),
		[],
	);

	return (
		<flexboxlayout onLayoutChanged={outerLayout}>
			<flexboxlayout
				onLayoutChanged={innerLayout}
				id={props.id}
				className={props.className}
				style={props.style}
			>
				{props.children}
			</flexboxlayout>
		</flexboxlayout>
	);
}
