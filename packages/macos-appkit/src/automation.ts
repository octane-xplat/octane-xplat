import { nodeClasses } from './style-values.ts'
import type { RootDirectoryReader } from './root-directory'
import type { Measurements } from './measurements'
import type { CssCascade } from './css-cascade'
import type { AccessibleHost } from './accessible-host'
import type { Actions } from './actions'
import type { Hover } from './hover'
import type { Popover } from './popover'
import type { UniversalRoot } from 'octane/universal/native'
import type { PanEvent, PropBag, ElementNode, RootContainer } from './model'
import { NSColor, NSNotification, NSScrollView } from '@octane-xplat/platform/macos'

interface Dependencies {
  directory: Pick<RootDirectoryReader, 'containers' | 'observe'>
  measurements: Pick<Measurements, 'measureParity' | 'descendants' | 'colorValue' | 'round'>
  cssCascade: Pick<CssCascade, 'setNodeInlineStyle' | 'flushStyleDirty' | 'cssSchemeName'>
  accessibleHost: Pick<AccessibleHost, 'accessibilityRoles' | 'accessibilityLabels'>
  actions: Pick<Actions, 'panHandlersByView' | 'invokeAction' | 'buttonActionTarget'>
  hover: Pick<Hover, 'hoverRecordByView'>
  popover: Pick<Popover, 'openPopups'>
}

export type Automation = ReturnType<typeof createAutomation>

export function createAutomation(deps: Dependencies) {
  const debugRoots = new Map<UniversalRoot, unknown>()

  function installAutomation(root: UniversalRoot, container: RootContainer) {
    if ((process.env as { [key: string]: string | undefined }).OCTANE_MACOS_AUTOMATION === '1') {
      // Ids resolve across every live container snapshot.
      const allNodes = () =>
        [...deps.directory.containers()].flatMap((entry) => [...entry.nodes.values()])
      const debug = {
        findId(id: string) {
          const node = allNodes().find((node) => node.props.id === id)
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
        measureParity(facets: readonly string[]) {
          return deps.measurements.measureParity(container, facets)
        },
        metrics() {
          const nodeTypes: Record<string, number> = {}
          let nativeViewCount = 0
          let mountedRowCount = 0
          let mappedRowCount = 0
          let parentedRowCount = 0
          let nativeAttachedRowCount = 0
          let firstMountedRow = Number.POSITIVE_INFINITY
          let lastMountedRow = -1
          let firstMappedRow = Number.POSITIVE_INFINITY
          let lastMappedRow = -1
          const mountedRows: { index: number; height: number }[] = []
          const scrollViews: PropBag[] = []
          for (const node of container.nodes.values()) {
            nodeTypes[node.type] = (nodeTypes[node.type] ?? 0) + 1
            if (node.view) {
              nativeViewCount += 1
            }

            if (node.type === 'scrollview' && node.view) {
              const bounds = node.view.contentView.bounds
              scrollViews.push({
                id: node.props.id ?? null,
                verticalOffset: Number(bounds.origin.y ?? 0),
                viewportHeight: Number(bounds.size.height ?? 0),
                contentHeight: Number(node.view.documentView?.frame?.size?.height ?? 0),
              })
            }

            const match = /^(?:row-r|bench-row-)(\d+)$/.exec(String(node.props.id ?? ''))
            if (!match) {
              continue
            }

            mappedRowCount += 1
            const index = Number(match[1])
            firstMappedRow = Math.min(firstMappedRow, index)
            lastMappedRow = Math.max(lastMappedRow, index)
            if (node.parent !== null) {
              parentedRowCount += 1
            }

            if (node.view?.superview != null) {
              nativeAttachedRowCount += 1
            }

            if (node.parent !== null && node.view?.superview != null) {
              mountedRowCount += 1
              firstMountedRow = Math.min(firstMountedRow, index)
              lastMountedRow = Math.max(lastMountedRow, index)
              mountedRows.push({
                index,
                height: Number(node.view.frame?.size?.height ?? 0),
              })
            }
          }

          return {
            nodeCount: container.nodes.size,
            nativeViewCount,
            mountedRowCount,
            mappedRowCount,
            parentedRowCount,
            nativeAttachedRowCount,
            firstMountedRow: Number.isFinite(firstMountedRow) ? firstMountedRow : null,
            lastMountedRow: lastMountedRow >= 0 ? lastMountedRow : null,
            firstMappedRow: Number.isFinite(firstMappedRow) ? firstMappedRow : null,
            lastMappedRow: lastMappedRow >= 0 ? lastMappedRow : null,
            mountedRows,
            scrollViews,
            nodeTypes,
          }
        },
        scrollToId(id: string, offset: number) {
          const node = allNodes().find(
            (candidate) => candidate.type === 'scrollview' && candidate.props.id === id,
          )

          if (!node) {
            throw new Error('No AppKit ScrollView with id ' + id)
          }

          const clipView = (node.view! as NSScrollView).contentView
          clipView.scrollToPoint({ x: 0, y: Math.max(0, Number(offset) || 0) })
          node.view!.reflectScrolledClipView(clipView)
          return Number(clipView.bounds.origin.y ?? 0)
        },
        /** Web-style scroll offset: `top` is the distance from the
         *  document's visual top (scrollTop semantics). Non-flipped
         *  AppKit documents count clip origin y up from the bottom, so
         *  the conversion inverts through the doc/clip heights. */
        scrollToTop(id: string, top: number) {
          const node = allNodes().find(
            (candidate) => candidate.type === 'scrollview' && candidate.props.id === id,
          )

          if (!node) {
            throw new Error('No AppKit ScrollView with id ' + id)
          }

          const clipView = (node.view! as NSScrollView).contentView
          const doc = node.view!.documentView
          const docH = Number(doc.frame.size.height)
          const clipH = Number(clipView.bounds.size.height)
          const flipped = Boolean(doc.flipped)
          const t = Math.min(Math.max(Number(top) || 0, 0), Math.max(0, docH - clipH))
          const y = flipped ? t : docH - clipH - t
          clipView.scrollToPoint({ x: 0, y })
          node.view!.reflectScrolledClipView(clipView)
          return flipped
            ? Number(clipView.bounds.origin.y)
            : docH - clipH - Number(clipView.bounds.origin.y)
        },
        /** VirtualListBenchSnapshot for the scrollview with `id`: scrollTop-
         *  style offset plus each mounted vlist-bench-row-* row's top-down
         *  box relative to the viewport. Consumed by the app-side
         *  platform/virtual-list-benchmark.macos adapter. */
        listSnapshot(id: string) {
          const node = allNodes().find(
            (candidate) => candidate.type === 'scrollview' && candidate.props.id === id,
          )

          if (!node) {
            throw new Error('No AppKit ScrollView with id ' + id)
          }

          const clipView = (node.view! as NSScrollView).contentView
          const doc = node.view!.documentView
          const clipH = Number(clipView.bounds.size.height)
          const docH = Number(doc?.frame?.size?.height ?? 0)
          const flipped = Boolean(doc?.flipped)
          const originY = Number(clipView.bounds.origin.y ?? 0)
          // The VirtualList leaf publishes a content-space offset (anchored
          // to its top spacer, not the document frame) — prefer it since
          // docH-derived offsets drift every time estimates rebuild.
          const published = globalThis.__xplatVlistOffsets?.[id]
          const offset =
            typeof published === 'number' ? published : flipped ? originY : docH - clipH - originY

          const rows = deps.measurements.descendants(node).flatMap((child) => {
            const match = /^vlist-bench-row-(\d+)$/.exec(String(child.props?.id ?? ''))
            if (!match || !child.view) {
              return []
            }

            try {
              // Row box relative to the clip's top edge, computed in doc
              // coordinates so it stays docH-independent like `offset`.
              const inDoc = child.view.superview!.convertRectToView(child.view.frame, doc)
              const h = Number(inDoc.size.height)
              const y = Number(inDoc.origin.y)
              const top = flipped ? y - originY : originY + clipH - y - h
              return [{ index: Number(match[1]), top, bottom: top + h }]
            } catch {
              return []
            }
          })

          return {
            offset,
            viewportHeight: clipH,
            rows,
            mountedIndices: rows.map((row) => row.index),
          }
        },
        /** Node frame in window base coordinates (points, y-up from the
         *  window's bottom edge) — screenshot cropping consumes it. */
        frameInWindow(id: string) {
          if (id === ':host') {
            const winFrame = container.hostView.window?.frame
            return {
              x: 0,
              y: 0,
              w: Number(container.hostView.frame.size.width),
              h: Number(container.hostView.frame.size.height),
              isContentView: container.hostView.window?.contentView === container.hostView,
              autoresizingMask: Number(container.hostView.autoresizingMask ?? -1),
              translatesMask: Boolean(container.hostView.translatesAutoresizingMaskIntoConstraints),
              subviews: Number(container.hostView.subviews?.count ?? 0),
              window: winFrame
                ? {
                    w: Number(winFrame.size.width),
                    h: Number(winFrame.size.height),
                  }
                : null,
            }
          }

          const node = allNodes().find((candidate) => candidate.props.id === id && candidate.view)

          if (!node) {
            throw new Error('No AppKit view with id ' + id)
          }

          const rect = node.view!.convertRectToView(node.view!.bounds, null)
          return {
            x: Number(rect.origin.x),
            y: Number(rect.origin.y),
            w: Number(rect.size.width),
            h: Number(rect.size.height),
          }
        },
        /** Apply a single style prop on a mounted node — margin/layout probes. */
        setStyle(id: string, name: string, value: any) {
          const node = allNodes().find((candidate) => candidate.props.id === id)

          if (!node) {
            throw new Error('No AppKit node with id ' + id)
          }

          // Single-key writes merge into the node's inline style bag; the
          // cascade re-derives the effective style from it.
          const style = { ...node.props?.style }
          if (value == null) {
            delete style[name]
          } else {
            style[name] = value
          }

          deps.cssCascade.setNodeInlineStyle(node, style)
          deps.cssCascade.flushStyleDirty(node.container)
          container.hostView.layoutSubtreeIfNeeded?.()
          return this.frameInWindow(id)
        },
        /** Ancestor chain for a node id with frames — layout forensics. */
        ancestors(id: string) {
          const node = allNodes().find((candidate) => candidate.props.id === id)

          if (!node) {
            throw new Error('No AppKit node with id ' + id)
          }

          const chain: PropBag[] = []
          for (let cur: ElementNode | null = node; cur; cur = cur.parent) {
            chain.push({
              id: cur.props.id ?? null,
              type: cur.type,
              classes: nodeClasses(cur),
              frame: cur.view
                ? {
                    x: Number(cur.view.frame.origin.x),
                    y: Number(cur.view.frame.origin.y),
                    w: Number(cur.view.frame.size.width),
                    h: Number(cur.view.frame.size.height),
                  }
                : null,
            })
          }

          return chain
        },
        /** Per-cell geometry for the parity stage inside its ScrollView:
         *  top-down document offsets plus the window-space rect at the
         *  current scroll position, so a screenshot pass can choose
         *  offsets and crop without re-querying the host. */
        parityCellFrames(scrollId: string) {
          const scroll = allNodes().find(
            (candidate) => candidate.type === 'scrollview' && candidate.props.id === scrollId,
          )

          if (!scroll) {
            throw new Error('No AppKit ScrollView with id ' + scrollId)
          }

          const stage = allNodes().find((candidate) => candidate.props.id === 'parity-stage')

          if (!stage) {
            throw new Error('No parity stage mounted')
          }

          container.hostView.window?.contentView?.layoutSubtreeIfNeeded?.()
          scroll.view!.layoutSubtreeIfNeeded?.()
          const doc = scroll.view!.documentView
          const clip = scroll.view!.contentView
          const docH = Number(doc.frame.size.height)
          const clipH = Number(clip.bounds.size.height)
          const flipped = Boolean(doc.flipped)
          const cells = []
          for (const cell of stage.children) {
            if (!cell.view || !nodeClasses(cell).includes('parity-cell')) {
              continue
            }

            const inDoc = cell.view.convertRectToView(cell.view.bounds, doc)
            const inWindow = cell.view.convertRectToView(cell.view.bounds, null)
            cells.push({
              name: String(cell.props.id ?? '').replace(/^cell-/, ''),
              top: flipped
                ? Number(inDoc.origin.y)
                : docH - Number(inDoc.origin.y) - Number(inDoc.size.height),
              height: Number(inDoc.size.height),
              width: Number(inDoc.size.width),
              x: Number(inDoc.origin.x),
              window: {
                x: Number(inWindow.origin.x),
                y: Number(inWindow.origin.y),
                w: Number(inWindow.size.width),
                h: Number(inWindow.size.height),
              },
            })
          }

          const scrollInWindow = scroll.view!.convertRectToView(scroll.view!.bounds, null)
          return {
            docHeight: docH,
            viewportHeight: clipH,
            docFlipped: flipped,
            scrollTop: flipped
              ? Number(clip.bounds.origin.y)
              : docH - clipH - Number(clip.bounds.origin.y),
            scrollWindow: {
              x: Number(scrollInWindow.origin.x),
              y: Number(scrollInWindow.origin.y),
              w: Number(scrollInWindow.size.width),
              h: Number(scrollInWindow.size.height),
            },
            cells,
          }
        },
        scrollStats(id: string) {
          const node = allNodes().find(
            (candidate) => candidate.type === 'scrollview' && candidate.props.id === id,
          )

          if (!node) {
            throw new Error('No AppKit ScrollView with id ' + id)
          }

          return { ...(node.scrollMetrics ?? { events: [] }) }
        },
        inspect(id: string) {
          const node = id.startsWith('type:')
            ? allNodes().find((candidate) => candidate.type === id.slice(5) && candidate.view)
            : allNodes().find((candidate) => candidate.props?.id === id)

          if (!node?.view) {
            throw new Error('No AppKit view with id ' + id)
          }

          const view = node.view
          const appearance = view.effectiveAppearance ?? view.window?.effectiveAppearance
          const nativeWindow = view.window
          return {
            type: node.type,
            classes: nodeClasses(node),
            scheme: deps.cssCascade.cssSchemeName(node),
            color: view.textColor
              ? (deps.measurements.colorValue(view.textColor, appearance) ?? null)
              : null,
            backgroundColor: view.layer?.backgroundColor
              ? (deps.measurements.colorValue(
                  NSColor.colorWithCGColor(view.layer.backgroundColor),
                  appearance,
                ) ?? null)
              : null,
            frame: view.frame
              ? {
                  x: deps.measurements.round(Number(view.frame.origin.x)),
                  y: deps.measurements.round(Number(view.frame.origin.y)),
                  w: deps.measurements.round(Number(view.frame.size.width)),
                  h: deps.measurements.round(Number(view.frame.size.height)),
                }
              : null,
            window: nativeWindow
              ? {
                  frame: {
                    x: deps.measurements.round(Number(nativeWindow.frame.origin.x)),
                    y: deps.measurements.round(Number(nativeWindow.frame.origin.y)),
                    w: deps.measurements.round(Number(nativeWindow.frame.size.width)),
                    h: deps.measurements.round(Number(nativeWindow.frame.size.height)),
                  },
                  contentSize: nativeWindow.contentView?.frame?.size
                    ? {
                        w: deps.measurements.round(
                          Number(nativeWindow.contentView.frame.size.width),
                        ),
                        h: deps.measurements.round(
                          Number(nativeWindow.contentView.frame.size.height),
                        ),
                      }
                    : null,
                  fittingSize: nativeWindow.contentView?.fittingSize
                    ? {
                        w: deps.measurements.round(
                          Number(nativeWindow.contentView.fittingSize.width),
                        ),
                        h: deps.measurements.round(
                          Number(nativeWindow.contentView.fittingSize.height),
                        ),
                      }
                    : null,
                  styleMask: Number(nativeWindow.styleMask ?? 0),
                  colorScheme: globalThis.__xplatAppKit?.getColorScheme?.() ?? null,
                }
              : null,
          }
        },
        snapshot() {
          return {
            labels: allNodes()
              .filter((node) => node.type === 'label' && node.view)
              .map((node) => node.view!.stringValue),
            buttons: allNodes()
              .filter((node) => node.type === 'button' && node.view)
              .map((node) => node.view!.title),
            pressables: allNodes()
              .filter(
                (node) =>
                  node.type === 'masonview' &&
                  node.actionId !== undefined &&
                  deps.accessibleHost.accessibilityRoles.get(node.actionId!) === 'button',
              )
              .map((node) => deps.accessibleHost.accessibilityLabels.get(node.actionId!)),
          }
        },
        /** Dispatch through the same event scope as the AppKit pan recognizer. */
        panView(view: any, event: PanEvent) {
          const handler = deps.actions.panHandlersByView.get(view)
          if (!handler) {
            throw new Error('No AppKit pan handler attached')
          }

          handler({ ...event, view })
        },
        pressId(id: string) {
          const node = allNodes().find((candidate) => candidate.props.id === id)
          if (!node || node.actionId === undefined) {
            throw new Error('No AppKit pressable with id ' + id)
          }

          deps.actions.invokeAction(node.actionId)
        },
        setText(idOrPlaceholder: string, value: any) {
          const node = allNodes().find(
            (candidate) =>
              (candidate.type === 'textfield' || candidate.type === 'textview') &&
              (candidate.props.id === idOrPlaceholder ||
                candidate.props.placeholder === idOrPlaceholder),
          )

          if (!node || node.actionId === undefined) {
            throw new Error('No AppKit text input with id or placeholder ' + idOrPlaceholder)
          }

          if (node.type === 'textview') {
            node.view!.string = String(value)
            deps.actions.buttonActionTarget.textDidChange({ object: node.view } as NSNotification)
          } else {
            node.view!.stringValue = String(value)
            deps.actions.buttonActionTarget.controlTextDidChange({
              object: node.view,
            } as NSNotification)
          }
        },
        pressAccessibilityLabel(label: string) {
          const node = allNodes().find(
            (candidate) =>
              candidate.type === 'masonview' &&
              candidate.actionId !== undefined &&
              deps.accessibleHost.accessibilityLabels.get(candidate.actionId) === label,
          )

          if (!node) {
            throw new Error('No AppKit pressable labeled ' + label)
          }

          if (!node.view!.accessibilityPerformPress()) {
            throw new Error('AppKit pressable has no action for ' + label)
          }
        },
        pressButton(title: string) {
          const node = allNodes().find(
            (candidate) => candidate.type === 'button' && candidate.view!.title === title,
          )

          if (!node) {
            throw new Error('No AppKit button titled ' + title)
          }

          node.view!.performClick(null)
        },
        hover(id: string, phase: 'enter' | 'exit') {
          const node = allNodes().find((candidate) => candidate.props?.id === id && candidate.view)

          if (!node) {
            throw new Error('No AppKit view with id ' + id)
          }

          const record = deps.hover.hoverRecordByView.get(node.view!)
          if (!record) {
            throw new Error('No hover observer on ' + id)
          }

          const handler = phase === 'exit' ? record.exit : record.enter
          if (typeof handler !== 'function') {
            throw new Error('No ' + phase + ' handler on ' + id)
          }

          handler()
        },
        openPopupCount() {
          return deps.popover.openPopups.size
        },
      }

      try {
        Object.defineProperty(root, '__macosDebug', { value: debug, configurable: true })
        Object.defineProperty(globalThis, '__xplatMacOSDebug', { value: debug, configurable: true })
        debugRoots.set(root, debug)
      } catch (error) {
        if (Reflect.get(root, '__macosDebug') === debug) {
          Reflect.deleteProperty(root, '__macosDebug')
        }
        throw error
      }
      return () => {
        debugRoots.delete(root)
        if (Reflect.get(root, '__macosDebug') === debug) {
          Reflect.deleteProperty(root, '__macosDebug')
        }
        if (Reflect.get(globalThis, '__xplatMacOSDebug') === debug) {
          const latest = [...debugRoots.values()].at(-1)
          if (latest) {
            Object.defineProperty(globalThis, '__xplatMacOSDebug', { value: latest, configurable: true })
          } else {
            Reflect.deleteProperty(globalThis, '__xplatMacOSDebug')
          }
        }
      }
    }
  }
  let activated = false
  function activate() {
    if (activated) {
      return
    }
    deps.directory.observe(container => installAutomation(container.root!, container))
    activated = true
  }
  return { activate }
}
