// macOS Core provider: FadeTransition — the common class
// shape so imports work. Frame navigation ignores transitions on macOS
// (recorded gap, same as before — there is no UINavigationController
// transition delegate to hang the fade on).
import { Transition } from '@nativescript/core/ui/transition';
export class FadeTransition extends Transition {
}
