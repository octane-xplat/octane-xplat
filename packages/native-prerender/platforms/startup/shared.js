import {
  prepareFirstFrame,
  selectLaunchTree,
  validateArtifact,
} from '@octane-xplat/native-prerender'
import {
  createNativeScriptRoot,
  renderNativeScriptApp,
} from '@octane-xplat/nativescript-octane'

/**
 * Stable bind projection shared with XplatMasonArtifact.selectIndex (Swift)
 * and MasonArtifact.selectIndex (Java): alphabetical keys over a flat string
 * dictionary. Native mount and JavaScript resolution must agree byte-for-byte.
 */
export function canonicalBind(bind) {
  return JSON.stringify(bind, Object.keys(bind).sort())
}

/**
 * Shared cold-start adoption transaction. The platform module supplies the
 * installable mount lookup and the platform binding; everything else is the
 * same on iOS and Android.
 *
 * The entry owns the full transaction boundary: any rejection — missing or
 * rejected artifact, mismatched launch bind, prepared-tree mismatch, claim
 * failure or a failed commit — returns the ordinary render path with no
 * half-adopted state. The mount is claimed at most once per process: a second
 * call always renders ordinarily.
 */
export function renderWithStartupCore(host, component, props, startup, platform) {
  let settle
  const outcome = new Promise((resolve) => {
    settle = resolve
  })
  let finished = false
  const finish = (value) => {
    if (finished) {
      return
    }
    finished = true
    settle(value)
    try {
      startup?.onOutcome?.(value)
    } catch (error) {
      console.error('native-prerender startup outcome callback failed', error)
    }
  }

  const ordinary = (reason) => {
    platform.discardMount()
    const root = renderNativeScriptApp(host, component, props ?? {})
    finish({ adopted: false, reason, root })
    return { root, outcome }
  }

  try {
    if (platform.consumed()) {
      return ordinary('startup mount already claimed')
    }

    let mount
    try {
      mount = platform.readMount()
    } catch (error) {
      // A corrupt native handoff is a rejection, not an entry crash: fall back.
      return ordinary(
        'native mount unreadable: ' + (error instanceof Error ? error.message : String(error)),
      )
    }

    // The handoff is needed by ordinary rendering too: the installable mount
    // bootstrap created the window before JavaScript ran, and NativeScript
    // must reuse it rather than create a second one. It must precede every
    // rejection below, including artifact validation.
    platform.installHandoff(mount)

    const artifact = validateArtifact(startup?.artifact)

    if (!mount) {
      return ordinary('no startup mount for this entry')
    }
    if (mount.rejected) {
      return ordinary('native mount rejected: ' + mount.rejected)
    }

    const appearance = platform.appearance()
    if (mount.theme !== appearance) {
      return ordinary(
        `native mount theme ${mount.theme} does not match current appearance ${appearance}`,
      )
    }

    const tree = selectLaunchTree(artifact, platform.resolveInput)
    if (!tree) {
      return ordinary('resolved launch inputs match no artifact tree')
    }
    if (canonicalBind(tree.bind) !== canonicalBind(mount.bind)) {
      return ordinary('native bind diverged from JavaScript launch resolution')
    }

    // From here the mount is consumed: failures below still render
    // ordinarily, but never through a second adoption attempt.
    platform.claimMount()

    let binding
    let root
    let prepared
    try {
      binding = platform.bindTree(tree.nodes, mount)
      platform.styleHost(binding.host, mount, startup?.sheets)
      root = createNativeScriptRoot(binding.host, {
        createView: binding.claims.createView,
      })
      prepared = prepareFirstFrame(root, component, props ?? {})
      binding.claims.match(prepared.batch.commands)
    } catch (error) {
      try {
        prepared?.abort?.()
      } catch {}
      try {
        root?.unmount()
      } catch {}
      try {
        binding?.retire()
      } catch {}
      return ordinary(
        'prepared tree rejected: ' + (error instanceof Error ? error.message : String(error)),
      )
    }

    host.content = binding.host

    // iOS keeps native inserts deferred until each child loads; Android
    // consumes the same expectations during attach. Either way the claim
    // commit runs once the bound host is loaded under the live page.
    binding.host.once('loaded', () => {
      try {
        mount.restoreDefaults()
        binding.commit(() => prepared.commit())
        finish({
          adopted: true,
          root,
          mount,
          tree,
          claims: binding.claims,
          wrappers: binding.wrappers,
          natives: mount.natives,
        })
      } catch (error) {
        // The commit scope failed: release claims and bound state, detach the
        // cold tree and render ordinarily into the same page.
        try {
          platform.releaseFailed(binding)
        } catch {}
        try {
          platform.discardMount()
        } catch {}
        try {
          host.content = undefined
        } catch {}
        ordinary(
          'claim commit failed: ' + (error instanceof Error ? error.message : String(error)),
        )
      }
    })

    return { root, outcome }
  } catch (error) {
    // Every failure — artifact, handoff, resolution or an unexpected throw —
    // ends in ordinary rendering. Only a failure inside ordinary() itself
    // (which throws again here) reaches the caller.
    return ordinary(error instanceof Error ? error.message : String(error))
  }
}
