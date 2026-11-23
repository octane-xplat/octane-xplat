// GTK animations are applied by the GTK style projection.
export class Animation {
  constructor() {
    throw new Error('NativeScript Core Animation is unavailable on GTK')
  }
}
