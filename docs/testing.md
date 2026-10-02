# Checking an Xplat app

> Try the actions your app supports, then use code checks to catch problems
> you might miss while using it.

After a change, open the app and try it. For a packing list, add an item,
mark it packed, and remove it. Check that the remaining count changes and
that the empty list still offers a way to add another item.

A coding agent can help run checks and fix failures. Ask it to tell you
which commands passed and where it ran the app. A successful browser check
is useful; you still need to try a phone feature on a phone or simulator.

## The short feedback loop

From your app's folder, run these commands one at a time, or ask your agent
to run them:

| Command          | What it checks                                              |
| ---------------- | ----------------------------------------------------------- |
| `pnpm lint`      | Looks for code patterns that can cause mistakes.            |
| `pnpm typecheck` | Checks that values and options match what the code expects. |
| `pnpm build`     | Checks that the browser app can be prepared for release.    |

Each command should finish without errors. If one fails, copy the error
into your agent and ask it to fix the cause, then run the check again.
These commands don't click buttons or fill in forms, so try those actions
in the running app too.

As your app grows, add **automated tests**: code that performs checks for
you, such as verifying that packing one of two items leaves one remaining.
The starter does not include a test runner or `test` command. Ask your agent
to help configure one when you need to repeat those checks automatically.

## Test behavior, not renderer markup

The browser and phones use different underlying views to display a screen.
A test should check what someone can do with it: pressing a button updates
the list, opening a link shows the right screen, and closing a dialog
returns to the previous screen.

For example, a packing-list test can add “Passport,” mark it packed, and
check that the remaining count decreases. It can then remove the item and
check the empty-list message. The code that drives the test can differ
between web and phone; the expected result stays the same.

When reporting a problem to an agent, include the action and what happened:
“After packing Passport, the remaining count still says two; it should say
one.” That gives it a specific result to work toward.

## Verify before you ship

Before releasing an app for other people to use:

1. Try the important actions on each platform you plan to release for. A
   simulator or emulator helps during development; device features also need
   checks on a real device.
2. Try what happens when something goes wrong: decline camera access,
   cancel a file picker, or load data without a network connection. The app
   should explain the problem and offer a useful next action.
3. Build the release version with `pnpm xplat build --release` from the app
   folder. This prepares the web app and uses NativeScript release builds
   for configured phone targets. Phone signing must already be set up;
   uploading to an app store is a separate step.
4. Try that release build too. It is prepared differently from the app you
   run while editing. [Known limits](known-limits.md#same-edge-on-every-target)
   lists current release issues. Rows marked `desk` describe behavior checked
   by reading source code; try any of those features your app depends on.

For code-level tests, keep calculations such as “how many items remain”
separate from screen code so a test can call them directly. Use device
checks for focus, gestures, element size, and permission dialogs.

If you are working on the framework itself, [single-case probing](probing.md)
explains how to run one small investigation. The [testing notes](testing-notes.md)
cover the framework's test tools and automation.
