// NativeScript iOS globals; diagnostics stay in this fixture app's sandbox.
export function writeProbeDiagnostic(name, value) {
  const data = NSString.stringWithString(value).dataUsingEncoding(4)
  const written = NSFileManager.defaultManager.createFileAtPathContentsAttributes(
    NSHomeDirectory() + '/Documents/' + name,
    data,
    null,
  )
  if (!written) throw new Error('Could not write native fixture diagnostic: ' + name)
}
