const STATEMENT_LISTS = {
	Program: ['body'],
	BlockStatement: ['body'],
	StaticBlock: ['body'],
	SwitchCase: ['consequent'],
	TSModuleBlock: ['body'],
	JSXCodeBlock: ['body'],
};

function firstLineBreak(text) {
	return /\r\n|\n|\r/.exec(text);
}

function hasBlankLineAfter(source, end, nextStart) {
	const gap = source.slice(end, nextStart);
	const lineBreak = firstLineBreak(gap);
	if (!lineBreak) return false;
	const afterLine = gap.slice(lineBreak.index + lineBreak[0].length);
	const nextLineBreak = firstLineBreak(afterLine);
	return nextLineBreak !== null && afterLine.slice(0, nextLineBreak.index).trim() === '';
}

function insertBlankLine(source, end, nextStart) {
	const gap = source.slice(end, nextStart);
	const lineBreak = firstLineBreak(gap);
	if (!lineBreak) {
		const eol = firstLineBreak(source)?.[0] ?? '\n';
		return { position: end, text: `${eol}${eol}` };
	}

	return {
		position: end + lineBreak.index + lineBreak[0].length,
		text: lineBreak[0],
	};
}

function isMultiline(node, source) {
	if (node.loc?.start?.line && node.loc?.end?.line) {
		return node.loc.start.line < node.loc.end.line;
	}

	return /\r\n|\n|\r/.test(source.slice(node.start, node.end));
}

function* childNodes(node) {
	for (const [key, value] of Object.entries(node)) {
		if (key === 'parent' || key === 'loc' || key === 'range') continue;
		if (Array.isArray(value)) {
			for (const child of value) {
				if (child && typeof child === 'object' && typeof child.type === 'string') yield child;
			}
		} else if (value && typeof value === 'object' && typeof value.type === 'string') {
			yield value;
		}
	}
}

/** Find blank-line spacing violations in an ESTree or TSRX AST. */
export function findSpacingViolations(program, source) {
	const violations = [];
	const visited = new Set();
	const visit = (node) => {
		if (!node || typeof node !== 'object' || visited.has(node)) return;
		visited.add(node);

		for (const key of STATEMENT_LISTS[node.type] ?? []) {
			const siblings = node[key];
			if (!Array.isArray(siblings)) continue;
			for (let index = 0; index < siblings.length - 1; index++) {
				const current = siblings[index];
				const next = siblings[index + 1];
				if (!current || !next || !isMultiline(current, source)) continue;
				if (hasBlankLineAfter(source, current.end, next.start)) continue;
				violations.push({
					node: current,
					messageId: 'afterMultiline',
					...insertBlankLine(source, current.end, next.start),
				});
			}
		}

		if (node.type === 'JSXCodeBlock' && node.body?.length && node.render) {
			const setup = node.body[node.body.length - 1];
			if (!hasBlankLineAfter(source, setup.end, node.render.start)) {
				violations.push({
					node: setup,
					messageId: 'beforeImplicitReturn',
					...insertBlankLine(source, setup.end, node.render.start),
				});
			}
		}

		for (const child of childNodes(node)) visit(child);
	};

	visit(program);
	return violations;
}

export function applySpacingFixes(source, violations) {
	let fixed = source;
	const fixes = [...violations].sort((a, b) => b.position - a.position);
	for (const fix of fixes) {
		fixed = fixed.slice(0, fix.position) + fix.text + fixed.slice(fix.position);
	}

	return fixed;
}
