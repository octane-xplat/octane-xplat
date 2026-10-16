import type { NSCoder, NSDictionary } from './Foundation'

import type { interop } from './objc-runtime'

import { NSControl } from './AppKit'

import { NSObject } from './Runtime'

export declare const BCParameterNameBody: string

export declare const BCParameterNameGroup: string

export declare const BCParameterNameIntent: string

export declare const BCChatButtonStyle: {
	Light: 0
	Dark: 1
}

export declare class BCChatButton extends NSControl {
	initWithStyle(style: interop.Enum<typeof BCChatButtonStyle>): this

	initWithCoder(coder: NSCoder): this
}

export declare class BCChatAction extends NSObject {
	static openTranscriptIntentParameters(
		businessIdentifier: string,
		intentParameters:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): void
}
