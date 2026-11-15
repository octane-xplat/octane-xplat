/** One 3D engine behind the demo's shared surface: init on a WebGL2
 *  context owned by the canvas element, load a glb from raw bytes, rotate
 *  the loaded model, render one frame on demand, and report a status line.
 *  No rAF/ticker — the demo drives frames explicitly so taps and probe
 *  reads are deterministic. */
export interface EngineAdapter {
  /** Short engine label for the status line ('playcanvas' / 'pixi3d'). */
  readonly name: string
  /** Bind the engine to an existing WebGL2 context on the given canvas. */
  init(canvas: unknown, gl: WebGL2RenderingContext, width: number, height: number): void | Promise<void>
  /** Parse + upload a binary glTF model from bytes already in memory. */
  loadModel(bytes: ArrayBuffer): Promise<void>
  /** Rotate the model `rad` radians about Y (applied on the next frame). */
  rotate(rad: number): void
  /** Render exactly one frame. */
  frame(dt: number): void
  /** One-line render evidence: draw count and center-pixel vs clear color. */
  stats(): string
  /** Free engine resources bound to this canvas. */
  dispose(): void
}
