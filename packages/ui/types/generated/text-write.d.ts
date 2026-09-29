/** Controlled `text` write for TextInput/TextArea leaves. The driver's
 *  generic prop path writes view.text verbatim; on Android the EditText
 *  setText resets the cursor to 0 on every controlled write. Park and
 *  restore the selection around the write (clamped to the new length so an
 *  append-shrink can't throw). iOS keeps the plain write — UITextField's
 *  text setter preserves the selected text range already.
 *  Returns without writing when the value already matches — the textChange
 *  echo of the user's own typing must not bounce back through setText. */
export declare function writeText(view: any, value: string | undefined | null): void;
