import { Application, Page } from '@nativescript/core';
import { renderNativeScriptApp } from '@nativescript-community/octane';
import { App } from '@xplat/app';
import './app.css';

const roots = new Set<ReturnType<typeof renderNativeScriptApp>>();

function createWindowContent(): Page {
  const page = new Page();
  page.actionBarHidden = true;
  roots.add(renderNativeScriptApp(page, App));
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
