import { FailureCollector } from './failures.ts'
import { withLayoutBatch } from './layout-batch.ts'
import type { Registry } from './registry'
import type { Nodes } from './nodes'
import type { Tree } from './tree'
import type { Projection } from './projection'
import type { ElementProps } from './element-props'
import type { CssCascade } from './css-cascade'
import type { CssPseudoState } from './css-pseudo-state'
import type { Layout } from './layout'
import type { PropBag, AppKitView, ElementNode, RootContainer } from './model'
import type {
  UniversalHostCommand,
  UniversalHostDriver,
  UniversalHostParent,
} from 'octane/universal/native'
import { flushTabViews } from './tab-view'
import { notifyLayoutCommit } from './layout-observers'

interface Dependencies {
  registry: Pick<
    Registry,
    | 'typeHasView'
    | 'assertSupportedType'
    | 'parentReference'
    | 'resolveParentNode'
    | 'canContainView'
    | 'isPortalTargetView'
    | 'nodeContainersByView'
    | 'cssNodesByView'
    | 'portalHandlesByNode'
  >
  nodes: Pick<Nodes, 'validateNodeProps' | 'destroy' | 'makeNode'>
  tree: Pick<Tree, 'validateTextNesting' | 'textOnlyChildError' | 'detach' | 'insert' | 'remove'>
  projection: Pick<Projection, 'validateProxyTree'>
  elementProps: Pick<ElementProps, 'applyProps' | 'droppedPropClears'>
  cssCascade: Pick<CssCascade, 'cssChildren' | 'flushStyleDirty'>
  cssPseudoState: Pick<CssPseudoState, 'syncPseudoTracking'>
  layout: Pick<Layout, 'drainLayoutDirty'>
}

export type Driver = ReturnType<typeof createDriver>

export function createDriver(deps: Dependencies) {
  /** Pre-flight a whole batch without mutating, so a deterministic failure —
   *  bad props, unknown nodes, illegal parents, unsupported ops — rejects the
   *  batch before any command applies. Residual mid-apply failures are then
   *  limited to unexpected native errors, and each command unwinds itself. */
  function validateBatch(container: RootContainer, commands: readonly UniversalHostCommand[]) {
    // Ids created by this batch are not in container.nodes yet — track them so
    // later commands validate against the intended tree.
    const pending = new Map<number, { type: string; props: PropBag }>()
    const destroyed = new Set<number>()
    const parents = new Map<number, UniversalHostParent>()
    const parentOf = (id: number): UniversalHostParent | undefined => {
      if (parents.has(id)) {
        return parents.get(id)
      }

      const node = container.nodes.get(id)
      return node ? deps.registry.parentReference(node.parent) : undefined
    }

    const known = (id: number): { type: string; props: PropBag } | undefined =>
      pending.get(id) ?? (destroyed.has(id) ? undefined : container.nodes.get(id))

    const parentNode = (parent: UniversalHostParent) => {
      if (parent === null) {
        return null
      }

      return typeof parent === 'number'
        ? (known(parent) ?? null)
        : deps.registry.resolveParentNode(container, parent)
    }

    for (const command of commands) {
      switch (command.op) {
        case 'create':
          deps.registry.assertSupportedType(command.type)
          deps.nodes.validateNodeProps(command.type, command.props)
          pending.set(command.id, { type: command.type, props: command.props })
          parents.set(command.id, null)
          destroyed.delete(command.id)
          continue
        case 'recreate': {
          const entry = known(command.id)
          if (!entry) {
            throw new Error('Unknown AppKit node ' + command.id)
          }

          deps.registry.assertSupportedType(command.type)
          deps.nodes.validateNodeProps(command.type, command.props)
          const existing = container.nodes.get(command.id)
          const parentId = parentOf(command.id) ?? null
          const parent = parentNode(parentId)
          deps.tree.validateTextNesting(parent?.type, command.type)
          if (
            ['masonview', 'contentview', 'actionbar', 'rootlayout', 'proxyviewcontainer'].includes(
              parent?.type ?? '',
            ) &&
            !deps.registry.typeHasView(command.type) &&
            command.type !== 'proxyviewcontainer'
          ) {
            throw deps.tree.textOnlyChildError(parent, command.type, { props: command.props })
          }

          if (
            existing?.parent &&
            (deps.registry.typeHasView(command.type) || command.type === 'proxyviewcontainer') &&
            !deps.registry.canContainView(existing.parent.type)
          ) {
            throw new Error('AppKit <' + existing.parent.type + '> cannot contain child views')
          }

          pending.set(command.id, { type: command.type, props: command.props })
          continue
        }
        case 'update': {
          const entry = known(command.id)
          if (!entry) {
            throw new Error('Unknown AppKit node ' + command.id)
          }

          deps.nodes.validateNodeProps(entry.type, command.props, entry.props)
          continue
        }
        case 'insert':
        case 'move': {
          const entry = known(command.id)
          if (!entry) {
            throw new Error('Unknown AppKit node ' + command.id)
          }

          const parentId = command.parent
          const parent = parentNode(parentId)
          deps.tree.validateTextNesting(parent?.type, entry.type)
          if (parentId !== null) {
            if (!parent) {
              throw new Error(
                'Unknown AppKit ' +
                  (typeof parentId === 'number'
                    ? 'parent ' + parentId
                    : 'portal parent ' + parentId.id),
              )
            }

            if (
              [
                'masonview',
                'contentview',
                'actionbar',
                'rootlayout',
                'proxyviewcontainer',
              ].includes(parent.type) &&
              !deps.registry.typeHasView(entry.type) &&
              entry.type !== 'proxyviewcontainer'
            ) {
              throw deps.tree.textOnlyChildError(parent, entry.type, { props: entry.props })
            }

            if (
              (deps.registry.typeHasView(entry.type) || entry.type === 'proxyviewcontainer') &&
              !deps.registry.canContainView(parent.type)
            ) {
              throw new Error('AppKit <' + parent.type + '> cannot contain child views')
            }
          }

          const seen = new Set([command.id])
          for (
            let ancestor: UniversalHostParent = parentId;
            typeof ancestor === 'number';
            ancestor = parentOf(ancestor) ?? null
          ) {
            if (seen.has(ancestor)) {
              throw new Error('AppKit logical ownership cycle')
            }

            seen.add(ancestor)
          }

          parents.set(command.id, parentId)
          continue
        }
        case 'destroy':
          pending.delete(command.id)
          destroyed.add(command.id)
          continue
        case 'remove':
          if (Object.is(parentOf(command.id), command.parent)) {
            parents.set(command.id, null)
          }

          continue
        case 'visibility':
        case 'ensure-public-instance':
          continue
        default:
          throw new Error('AppKit spike does not support host command ' + command.op)
      }
    }

    if (
      [...container.nodes.values()].some((node) => node.type === 'proxyviewcontainer') ||
      commands.some((command) => 'type' in command && command.type === 'proxyviewcontainer')
    ) {
      deps.projection.validateProxyTree(container, commands)
    }
  }

  function applyCommand(container: RootContainer, command: UniversalHostCommand) {
    switch (command.op) {
      case 'create': {
        // A retried batch can re-create an id the earlier attempt already
        // registered — release the previous node instead of orphaning it.
        const existing = container.nodes.get(command.id)
        if (
          ['masonview', 'contentview', 'actionbar', 'rootlayout'].includes(
            existing?.parent?.type ?? '',
          ) &&
          !deps.registry.typeHasView(command.type) &&
          command.type !== 'proxyviewcontainer'
        ) {
          throw deps.tree.textOnlyChildError(existing!.parent, command.type, {
            props: command.props,
          })
        }

        if (existing) {
          deps.tree.detach(container, existing)
          deps.nodes.destroy(existing)
        }

        container.nodes.set(
          command.id,
          deps.nodes.makeNode(container, command.id, command.type, command.props),
        )
        return
      }
      case 'update': {
        const node = container.nodes.get(command.id)
        if (!node) {
          throw new Error('Unknown AppKit node ' + command.id)
        }

        // node.props records what applied — restore it when a prop throws
        // mid-update so the bookkeeping doesn't claim unapplied props.
        const previousProps = node.props
        try {
          // Host updates carry the complete current prop bag; a key that
          // vanished must read as removed and reset what it installed.
          deps.elementProps.applyProps(node, {
            ...deps.elementProps.droppedPropClears(node, command.props),
            ...command.props,
          })
        } catch (error) {
          node.props = previousProps
          throw error
        }

        return
      }
      case 'insert':
      case 'move': {
        const node = container.nodes.get(command.id)
        if (!node) {
          throw new Error('Unknown AppKit node ' + command.id)
        }

        deps.tree.insert(container, command.parent, node, command.before)
        return
      }
      case 'remove': {
        const node = container.nodes.get(command.id)
        if (node) {
          deps.tree.remove(container, command.parent, node)
        }

        return
      }
      case 'destroy': {
        const node = container.nodes.get(command.id)
        if (node) {
          deps.nodes.destroy(node)
        }

        container.nodes.delete(command.id)
        return
      }
      case 'visibility': {
        const node = container.nodes.get(command.id)
        if (node?.view) {
          node.view.hidden = command.state === 'hidden'
        }

        return
      }
      case 'ensure-public-instance':
        return
      case 'recreate': {
        const node = container.nodes.get(command.id)
        if (!node) {
          throw new Error('Unknown AppKit node ' + command.id)
        }

        const parent = node.parent
        if (
          ['masonview', 'contentview', 'actionbar', 'rootlayout', 'proxyviewcontainer'].includes(
            parent?.type ?? '',
          ) &&
          !deps.registry.typeHasView(command.type) &&
          command.type !== 'proxyviewcontainer'
        ) {
          throw deps.tree.textOnlyChildError(parent, command.type, { props: command.props })
        }

        if (
          parent &&
          (deps.registry.typeHasView(command.type) || command.type === 'proxyviewcontainer') &&
          !deps.registry.canContainView(parent.type)
        ) {
          // insert would reject the replacement after the original was
          // already removed and destroyed — fail while it is intact.
          throw new Error('AppKit <' + parent.type + '> cannot contain child views')
        }

        const replacement = deps.nodes.makeNode(container, command.id, command.type, command.props)
        const siblings = parent ? parent.children : container.children
        const index = siblings.indexOf(node)
        const beforeId = index < 0 ? null : (siblings[index + 1]?.id ?? null)
        const parentId = deps.registry.parentReference(parent)
        deps.tree.remove(container, parentId, node)
        deps.nodes.destroy(node)
        container.nodes.set(command.id, replacement)
        deps.tree.insert(container, parentId, replacement, beforeId)
        return
      }
      default:
        throw new Error('AppKit spike does not support host command ' + command.op)
    }
  }

  const macOSDriver: UniversalHostDriver<RootContainer, any> = {
    id: 'macos',
    capabilities: { text: 'host' },
    portals: {
      prepareTarget({ container, target, createPortalTargetHandle }) {
        if (!deps.registry.isPortalTargetView(target)) {
          throw new TypeError('AppKit portal targets must be NSView instances.')
        }

        const owner = deps.registry.nodeContainersByView.get(target)
        if (owner && owner !== container) {
          throw new Error('AppKit portal target belongs to another Octane root.')
        }

        let id = container.portalTargetIds.get(target)
        if (id === undefined) {
          id = container.nextPortalTargetId++
          container.portalTargetIds.set(target, id)
        }

        const handle = createPortalTargetHandle(id)
        let registration = container.portalTargets.get(handle)
        if (registration && registration.root.view !== target) {
          throw new Error('AppKit portal target handle resolved to a different NSView.')
        }

        if (!registration) {
          const root: ElementNode = {
            id: -id,
            type: 'portalroot',
            view: target as AppKitView,
            props: {},
            parent: null,
            children: [],
            container,
            appliedFontFamily: container.fontFamily,
            scrollObserverInstalled: false,
            text: '',
            cssType: 'portalroot',
            cssClasses: new Set(),
            cssPseudoClasses: new Set(),
            computedStyle: undefined,
            computedCustomProps: new Map(),
          }

          root.getChildIndex = (child: ElementNode) =>
            deps.cssCascade.cssChildren(root).indexOf(child)
          root.getChildAt = (i: number) => deps.cssCascade.cssChildren(root)[i]
          root.getChildrenCount = () => deps.cssCascade.cssChildren(root).length

          deps.registry.cssNodesByView.set(target as object, root)
          deps.cssPseudoState.syncPseudoTracking(root)
          deps.registry.portalHandlesByNode.set(root, handle)
          registration = { root, registrations: 0 }
          container.portalTargets.set(handle, registration)
        }

        registration.registrations++
        let released = false
        return {
          handle,
          release() {
            if (released) {
              return
            }

            released = true
            registration!.registrations--
            if (registration!.registrations !== 0) {
              return
            }

            let cleanupError: unknown
            for (const child of registration!.root.children.slice()) {
              try {
                deps.tree.detach(container, child)
              } catch (error) {
                cleanupError ??= error
              }
            }

            deps.registry.portalHandlesByNode.delete(registration!.root)

            if (container.portalTargets.get(handle) === registration) {
              container.portalTargets.delete(handle)
            }

            if (cleanupError !== undefined) {
              throw cleanupError
            }
          },
        }
      },
    },
    prepareBatch(container, batch) {
      // Reject deterministic failures before any command mutates — a
      // partially applied batch cannot be rolled back once commit() marks
      // it accepted. Prepare acquires nothing, so abort() has no cleanup.
      validateBatch(container, batch.commands)
      return {
        apply() {
          withLayoutBatch(container, () => {
            const failures = new FailureCollector()
            failures.run('commands', () => {
              for (const command of batch.commands) {
                try {
                  applyCommand(container, command)
                } catch (error) {
                  // The universal root can swallow a mid-batch failure when it
                  // retries or aborts the attempt — log it here so an
                  // unsupported element cannot silently stall the mount.
                  console.error(
                    '[macos-host] command ' +
                      command.op +
                      ' failed for <' +
                      ((command as { type?: string }).type ?? '?') +
                      '> id=' +
                      ('id' in command ? command.id : '?'),
                    error,
                  )

                  throw error
                }
              }
            })
            failures.run('css', () => {
              // Restyle while the layout batch is open so style-driven layout
              // work joins the batch's single drain.
              deps.cssCascade.flushStyleDirty(container!)
            })
            failures.throwIfFailed()
          }, (dirty, outcome) => {
            // Tab/layout writes depend on a complete command + CSS pass. Do not
            // publish or continue a partial commit; later batches remain usable.
            if (outcome === 'failed') {
              return
            }
            flushTabViews(container)
            deps.layout.drainLayoutDirty(dirty)
            notifyLayoutCommit(container.hostView)
          })
        },
        abort() {},
      }
    },
    getPublicInstance(container, id) {
      const node = container.nodes.get(id)
      return node &&
        [
          'proxyviewcontainer',
          'formattedstring',
          'span',
          'segmentedbaritem',
          'tabviewitem',
        ].includes(node.type)
        ? node
        : (node?.view ?? null)
    },
  }
  return {
    macOSDriver,
  }
}
