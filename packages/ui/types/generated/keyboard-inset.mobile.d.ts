/** Lift a bottom-anchored overlay host above the software keyboard.
 *  iOS: a shared UIKeyboardWillChangeFrame observer tracks the inset and
 *  translateY shifts the host — reliable on popup views regardless of how
 *  the RootLayout passes margins through. The current inset is applied at
 *  bind time so hosts opened over an already-visible keyboard still lift.
 *  Android: when the window runs `adjustResize` (KeyboardAvoiding sets it)
 *  the RootLayout resizes and the host follows on its own; otherwise the
 *  decor view's IME inset supplies the lift. Returns an unbind that
 *  restores the transform — call it when the host detaches. */
export declare function bindBottomInsetToKeyboard(host: any): () => void;
