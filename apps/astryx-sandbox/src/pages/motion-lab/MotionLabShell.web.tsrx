/** @jsxImportSource @octane-xplat/jsx/dom */
// Copyright (c) Meta Platforms, Inc. and affiliates.
import { Layout, LayoutContent, LayoutPanel, VStack, List, ListItem, Text } from '@octane-xplat/ui'
import { cx } from '../../cx'
// Copyright (c) Meta Platforms, Inc. and affiliates.


/**
 * @file MotionLabShell.tsx
 * @input Motion Lab store, control rail, section registry
 * @output The scope element, the lab's own nav panel, and the control rail
 * @position Motion Lab chrome; used by the section layout
 *
 * Two jobs.
 *
 * The scope element is where the tuned custom properties land. Keeping them
 * here rather than on `:root` means the lab can retune `--ease-standard` to
 * argue about it without the sandbox's own chrome starting to move differently.
 *
 * The nav panel is here because the sandbox frames a tool as one entry in its
 * catalog — there is no per-tool rail to hang fifteen pages off, so without one
 * every page is a dead end. A start panel is the house pattern for it
 * (`LayoutPanelNavigation`), and it groups the pages the way the registry does,
 * which is the order they are meant to be read in.
 */

import { useRouterState } from '@octane-xplat/ui/routing'
import './MotionLab.css'
import './generated-classes.css'
import {useEffect, useRef, type ReactNode} from 'octane';
import {MotionLabProvider, useMotionLab} from './MotionLabStore';
import {MotionControlRail} from './MotionControlRail';
import {MOTION_SECTIONS} from './sections';



/**
 * Hrefs stay unprefixed: SandboxLink applies the Vite base path once in the
 * LinkProvider, and useRouterState().route?.href ?? '/' returns the path within that base path.
 * A second prefix here would break navigation on the staged /sandbox/ build.
 */

/** The export sets `trailingSlash: true`, so normalise before comparing. */
function isCurrent(pathname: string, href: string): boolean {
  const a = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const b = href.endsWith('/') ? href : `${href}/`;
  return a === b;
}

function LabNav() {
  const pathname = useRouterState().route?.href ?? '/';
  const groups = [...new Set(MOTION_SECTIONS.map(s => s.group))];

  return (
    <nav aria-label="Motion Lab pages" className={cx('ml-panel')}>
      {groups.map((group, i) => (
        <div key={group}>
          <Text
            type="supporting"
            color="secondary"
            weight="semibold"
            className={cx('ml-groupLabel', i === 0 && 'ml-firstGroupLabel')}>
            {group}
          </Text>
          <List density="compact">
            {MOTION_SECTIONS.filter(s => s.group === group).map(section => (
              <ListItem
                key={section.href}
                label={section.title}
                href={section.href}
                isSelected={isCurrent(pathname, section.href)}
              />
            ))}
          </List>
        </div>
      ))}
    </nav>
  );
}

export function MotionLabShell({children}: {children: ReactNode}) {
  const {registerScope, reducedMotion} = useMotionLab();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    registerScope(ref.current);
    return () => registerScope(null);
  }, [registerScope]);

  return (
    <div
      ref={ref}
      data-reduced-motion={reducedMotion}
      className={cx('ml-scope', 'ml-fill')}>
      <Layout
        height="fill"
        start={
          <LayoutPanel hasDivider width={228} padding={0} role="navigation">
            <LabNav />
          </LayoutPanel>
        }
        content={
          <LayoutContent padding={0}>
            <VStack gap={0}>
              <MotionControlRail />
              {children}
            </VStack>
          </LayoutContent>
        }
      />
    </div>
  );
}

/** Route-level wrapper: every /pages/motion-lab/* page renders inside the
 *  shared provider + shell, mirroring upstream's section layout.tsx. */
export function motionLabPage(Page: any) {
	return function MotionLabRoute() {
		return (
			<MotionLabProvider>
				<MotionLabShell>
					<Page />
				</MotionLabShell>
			</MotionLabProvider>
		)
	}
}
