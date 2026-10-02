import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	generateCommands,
	smoothPathD,
	parsePath,
	commandsToD,
	flipCommandsY,
} from '../src/path.ts';

const R = 10;
const W = 100;
const H = 50;

test('continuous uniform emits the Rosenfeld cubic set', () => {
	const cmds = generateCommands(W, H, { radius: R, curve: 'continuous' });
	// Entry tangent at p = 1.528665·R on the top edge.
	assert.deepEqual(cmds[0], { c: 'M', x: 15.28665, y: 0 });
	const cubics = cmds.filter((c) => c.c === 'C');
	assert.equal(cubics.length, 12); // 3 per corner
	// TR first cubic: control1 at f(1.08849296, 0), end at f(0.63149379, 0.07491139)
	// with f(x,y) = (w - x·R, y·R).
	assert.ok(Math.abs(cubics[0].x1 - (W - 1.08849296 * R)) < 1e-6);
	assert.ok(Math.abs(cubics[0].x - (W - 0.63149379 * R)) < 1e-6);
	assert.ok(Math.abs(cubics[0].y - 0.07491139 * R) < 1e-6);
	assert.equal(cmds.at(-1).c, 'Z');
});

test('continuous pill clamps so shoulders meet at edge midpoints', () => {
	const cmds = generateCommands(100, 50, { radius: 25, curve: 'continuous' });
	// R_eff = 25/1.528665 ≈ 16.35 → p = 25 on both axes.
	assert.equal(cmds[0].x, 25);
});

test('squircle delegates to lisse and parses arcs to center form', () => {
	const cmds = generateCommands(W, H, { radius: R, curve: 'squircle', smoothing: 0.6 });
	const arcs = cmds.filter((c) => c.c === 'A');
	assert.equal(arcs.length, 4);
	for (const a of arcs) {
		// Endpoints sit on the circle.
		assert.ok(Math.abs(Math.hypot(a.x - a.cx, a.y - a.cy) - a.r) < 0.01);
		// Centers sit inside the box.
		assert.ok(a.cx > 0 && a.cx < W && a.cy > 0 && a.cy < H, `center ${a.cx},${a.cy}`);
		assert.ok(Math.abs(a.sweepDeg) < 180);
	}
});

test('per-corner mixing keeps each curve per corner', () => {
	const cmds = generateCommands(W, H, {
		topLeft: { radius: R, curve: 'continuous' },
		topRight: { radius: R, curve: 'arc' },
		bottomRight: { radius: 20, curve: 'squircle', smoothing: 0.8 },
	});

	assert.equal(cmds.at(-1).c, 'Z');
	assert.ok(cmds.length > 5);
});

test('degenerate inputs stay sane', () => {
	assert.deepEqual(generateCommands(0, 0, { radius: 10 }), [
		{ c: 'M', x: 0, y: 0 },
		{ c: 'L', x: 0, y: 0 },
		{ c: 'L', x: 0, y: 0 },
		{ c: 'L', x: 0, y: 0 },
		{ c: 'Z' },
	]);

	const zero = generateCommands(W, H, { radius: 0, curve: 'squircle' });
	assert.ok(!zero.some((c) => c.c === 'C' || c.c === 'A'));
});

test('commandsToD round-trips through parsePath', () => {
	const cmds = generateCommands(W, H, { radius: R, curve: 'squircle', smoothing: 0.6 });
	const reparsed = parsePath(commandsToD(cmds));
	assert.equal(reparsed.length, cmds.length);
	for (let i = 0; i < cmds.length; i++) {
		assert.equal(reparsed[i].c, cmds[i].c);
	}
});

test('flipCommandsY mirrors for y-up (macOS) layer space', () => {
	const cmds = generateCommands(W, H, { radius: R, curve: 'continuous' });
	const flipped = flipCommandsY(cmds, H);
	assert.equal(flipped[0].y, H); // top edge → bottom in y-up
	for (const c of flipped) {
		if (c.c === 'A') {assert.ok(c.sweepDeg < 0 || c.sweepDeg === 0);}
	}
});

test('non-continuous paths use lisse output verbatim', () => {
	const d = smoothPathD(W, H, { radius: R, curve: 'squircle', smoothing: 0.6 });
	assert.ok(d.startsWith('M '));
	assert.ok(d.endsWith('Z'));
});
