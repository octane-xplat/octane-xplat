import { findSpacingViolations } from './spacing-rules.mjs';

const spacing = {
	meta: {
		type: 'layout',
		docs: { description: 'require blank lines after multiline statements' },
		fixable: 'whitespace',
		messages: {
			afterMultiline: 'Add a blank line after this multiline statement.',
			beforeImplicitReturn: 'Add a blank line before this TSRX implicit return.',
		},
	},
	create(context) {
		return {
			'Program:exit'(program) {
				const source = context.sourceCode.text;
				for (const violation of findSpacingViolations(program, source)) {
					context.report({
						node: violation.node,
						messageId: violation.messageId,
						fix(fixer) {
							return fixer.insertTextBeforeRange(
								[violation.position, violation.position],
								violation.text,
							);
						},
					});
				}
			},
		};
	},
};

export default {
	meta: { name: 'xplat' },
	rules: { spacing },
};
