import { Application, Page } from '@nativescript/core';
import { renderNativeScriptApp } from '@nativescript-community/octane';
import { App } from '@xplat/app';
import './app.css';

const roots = new Set<ReturnType<typeof renderNativeScriptApp>>();

console.log('[harness] entry evaluated, App=' + typeof App);

function createWindowContent(): Page {
  const page = new Page();
  page.actionBarHidden = true;
  console.log('[harness] createWindowContent');
  try {
    roots.add(renderNativeScriptApp(page, App));
    console.log('[harness] root mounted');
  } catch (e) {
    console.log('[harness] render threw: ' + ((e as Error)?.stack || e));
  }
  return page;
}

Application.run({
  create: () => createWindowContent(),
});

// A module-graph reload re-evaluates this entry and mounts fresh roots.
// @ts-expect-error — vite hot types; add vite/client to tsconfig types if desired
import.meta.hot?.dispose(() => {
  for (const root of roots) root.unmount();
  roots.clear();
});
