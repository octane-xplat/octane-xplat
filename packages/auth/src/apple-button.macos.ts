// Leaf-owned attachment: no renderer vocabulary or shared host change needed.
import type { AppleSignInButtonProps } from './types'

declare const objc: any
declare const NSObject: any
declare const interop: any
declare const ASAuthorizationAppleIDButton: any

let ActionTarget: any

export function attachAppleButton(view: any, props: AppleSignInButtonProps, press: () => void) {
	try {
		objc.import('AuthenticationServices')
	} catch {}

	if (typeof ASAuthorizationAppleIDButton === 'undefined') {
		throw new Error('The official Sign in with Apple button is unavailable on this host')
	}

	if (!ActionTarget) {
		ActionTarget = NSObject.extend(
			{
				press(this: any, _sender: any) {
					this.callback?.()
				},
			},
			{ exposedMethods: { 'press:': { params: [interop.types.id], returns: interop.types.void } } },
		)
	}

	const target = ActionTarget.new()
	target.callback = press
	// Values from ASAuthorizationAppleIDButton.h (macOS 10.15+).
	const type = props.type === 'continue' ? 1 : props.type === 'signUp' ? 2 : 0
	const theme = props.theme === 'white' ? 0 : props.theme === 'whiteOutline' ? 1 : 2
	const button =
		ASAuthorizationAppleIDButton.alloc().initWithAuthorizationButtonTypeAuthorizationButtonStyle(
			type,
			theme,
		)

	button.target = target
	button.action = 'press:'
	button.enabled = !props.disabled
	button.translatesAutoresizingMaskIntoConstraints = false
	view.addSubview(button)
	const constraints = [
		button.leadingAnchor.constraintEqualToAnchor(view.leadingAnchor),
		button.trailingAnchor.constraintEqualToAnchor(view.trailingAnchor),
		button.topAnchor.constraintEqualToAnchor(view.topAnchor),
		button.bottomAnchor.constraintEqualToAnchor(view.bottomAnchor),
	]

	for (const constraint of constraints) {
		constraint.active = true
	}

	return {
		// Target is weak in AppKit: retain its wrapper with the attachment handle.
		target,
		button,
		update(disabled: boolean) {
			button.enabled = !disabled
		},
		detach() {
			target.callback = null
			button.target = null
			for (const constraint of constraints) {
				constraint.active = false
			}

			button.removeFromSuperview()
		},
	}
}
