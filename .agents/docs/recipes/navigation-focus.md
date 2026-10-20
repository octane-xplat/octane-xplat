# Keep page focus and document scroll coherent

ID: navigation-focus
Targets: web
Related APIs: router.push, router.replace, router.back, router.refresh, head, hash

## Starting point

A generated browser route catalog and mounted outlet. Pages use meaningful
headings/landmarks and stable DOM IDs for controls that need history focus return.

## Requirements

Complete browser navigation with predictable focus, per-entry document scroll
and metadata, while stale work and modal presentation preserve the admitted view.

## Acceptance criteria

- AC1: A successful page change applies metadata and focuses its explicit
  autofocus target, level-one heading, main landmark or document body. It does
  not automatically focus an ordinary form control. Temporary tabindex changes
  are cleaned up without replacing an authored value.
- AC2: Back and Forward restore each entry's document position and saved focus,
  including two entries with the same URL and a control replaced during route
  revalidation. Refresh preserves current focus and scroll.
- AC3: Decoded fragment targets receive focus and browser fragment scrolling;
  modal opening/dismissal preserve background scroll and restore a noninteractive
  heading opener. Canonical modal admission and focus isolation remain in force.
- AC4: Superseded loaders cannot apply late focus, document scroll or metadata.
  Owner teardown releases temporary focus state. Document effects are distinct
  from nested scrollers, post-commit layout shifts, native focus and actual
  assistive-technology input.

## Documentation

- AC1: [Keep scroll and document metadata](../../../docs/app/navigation.md#keep-scroll-and-document-metadata) gives the focus order and page markup; [page focus checks](../navigation-checks.md#page-focus-and-entry-scroll) cover temporary and authored tabindex behavior.
- AC2: [Keep scroll and document metadata](../../../docs/app/navigation.md#keep-scroll-and-document-metadata) explains history and refresh; [entry checks](../navigation-checks.md#page-focus-and-entry-scroll) distinguish two same-URL entries.
- AC3: [Present a route modally](../../../docs/app/navigation.md#present-a-route-modally) and [page focus checks](../navigation-checks.md#page-focus-and-entry-scroll) cover fragments, background scroll and noninteractive opener return.
- AC4: [Keep scroll and document metadata](../../../docs/app/navigation.md#keep-scroll-and-document-metadata) defines cancellation and scope; [qualification](../navigation-checks.md#page-focus-and-entry-scroll) records teardown and actual target evidence.

The qualification guide includes the maintained Linux WebKitGTK procedure.
Linux execution is recorded there; Silo's recipe-target vocabulary does not
include Linux.
