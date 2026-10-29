### Keep macOS sign-in button results with their screen

Native AppKit sign-in buttons now ignore repeated pending activation and suppress
results after unmount. Mounted buttons use current callbacks. Google's trigger
uses NSButton actions, and the renderer now applies the documented isEnabled prop
to native buttons. Actual native input and lifecycle qualification remains pending.

```tsx
import { GoogleSignInButton } from '@octane-xplat/auth'
export function Entry() {
	return <GoogleSignInButton onResult={(result) => console.log(result.status)} />
}
```

See [AppKit button ownership](https://github.com/octane-xplat/octane-xplat/tree/main/packages/auth#appkit-button-action-ownership).
