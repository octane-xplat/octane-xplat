import { FadeTransition } from '@nativescript/core'
import { nativeMotion } from './navigation-motion'
class FixtureTransition extends FadeTransition {
	override iosNavigatedController(controller: any, operation: number, from: any, to: any): any {
		nativeMotion.events.push('ios:' + operation)
		// Core 9.1.3's implementation supplies this hook; its base declaration is optional.
		return super.iosNavigatedController!(controller, operation, from, to)
	}
}

export function createFixtureTransition() {
	return new FixtureTransition(100)
}
