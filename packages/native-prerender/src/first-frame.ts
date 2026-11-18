/**
 * First-frame flag contract shared with `@octane-xplat/motion`.
 *
 * A produced startup artifact bakes each motion host's mount-effect `initial`
 * seed into the emitted `style`, because refs and effects never run under
 * `root.prepare`. The live first render must bake the same seed or its
 * prepared commands diverge from the artifact: while
 * `globalThis.__xplatPrerenderFirstFrame === true`, motion merges
 * `initial === false ? animate : initial` into the host `style`, restricted
 * to channels inside the startup style bounds (`opacity` today).
 *
 * The flag is set for exactly one `prepare` call — the build host's own
 * producer worker and every live adoption first render — then cleared.
 * Motion reads the global directly so it never depends on this private
 * package; keep the name in sync with `components.tsrx`.
 */
export function prepareFirstFrame<Prepared>(
  root: { prepare(component: unknown, seed: unknown): Prepared },
  component: unknown,
  seed: unknown,
): Prepared {
  const scope = globalThis as { __xplatPrerenderFirstFrame?: boolean }
  const had = '__xplatPrerenderFirstFrame' in scope
  const prior = scope.__xplatPrerenderFirstFrame
  scope.__xplatPrerenderFirstFrame = true
  try {
    return root.prepare(component, seed)
  } finally {
    if (had) {
      scope.__xplatPrerenderFirstFrame = prior
    } else {
      delete scope.__xplatPrerenderFirstFrame
    }
  }
}
