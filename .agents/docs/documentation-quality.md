# Keep documentation useful

Use this review system when changing public guides, package READMEs, examples,
or the behavior they teach. [Audience and example rules](documentation.md)
define the writing standard; this page defines how to maintain it. A page is
ready when its intended reader can complete its job without asking a maintainer
to fill in missing steps. Passing a link checker alone does not establish that.

## Decide what the document owns

Before editing, state the reader, starting point, and outcome in a sentence.
For example: “An app author with a running starter can add a photo, cancel the
picker, and release the file when finished.” Use that sentence to decide what
belongs on the page. It need not become visible metadata.

| Document         | Owns                                                                                                                                       | Route elsewhere                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Package README   | What the package does, when to choose it, installation or why direct installation is inappropriate, first use, relevant limits, next guide | Complete feature inventories, implementation diaries, release administration |
| Task guide       | Prerequisites through a useful result, explanation, expected outcome, likely recovery, cleanup                                             | Unrelated advanced workflows and exhaustive signatures                       |
| Concept guide    | A mental model and the decisions it changes, with a concrete example                                                                       | Step-by-step setup already owned by a task guide                             |
| Reference        | Exact answers inside a declared boundary, grouped for lookup                                                                               | Repeated tutorials and unqualified support promises                          |
| Contributor note | Implementation rationale, evidence, maintenance constraints                                                                                | Required steps an app author needs; those belong in public guidance          |

Public declarations own exact types, defaults, and API behavior. Guides own
composition and workflows. READMEs introduce those workflows and link to their
canonical guides. Recipes own coverage requirements; Silo owns audit state and
verification evidence. Do not make another hand-maintained feature matrix or
copy the same setup into three places.

## Review six things

These are questions for judgment, not a mandatory heading template or a score.
One consequential failure can make a page unusable; strong prose elsewhere
does not compensate for a broken example.

| Dimension   | Ready when                                                                                  | Typical unfinished result                                                                       |
| ----------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Purpose     | The opening says what readers can accomplish and whether the page fits their task           | Install command before explanation; a list of engine names                                      |
| Path        | Required setup, file location, and the first useful result form a continuous path           | Code with no place to put it; hidden native configuration                                       |
| Examples    | Imports, data, actions, and lifecycle make sense together; examples use current APIs        | Undefined `save`, disposed objects reused later, JSX fragments posing as complete screens       |
| Truth       | Platform, host, version, and evidence boundaries qualify the claim where needed             | “Cross-platform” inferred from export files; old experiment totals presented as current support |
| Explanation | Readers understand why and can adapt the result; unfamiliar terms are introduced where used | Dense capability lists, unexplained “seams” and “facades,” generic benefit claims               |
| Navigation  | Readers can find the task, see their next step, and open links from the publishing surface  | Orphan README, accidental sidebar order, repo-only links used as consumer instructions          |

Apply the [writing and example contracts](documentation.md) during review.
For READMEs, connect explanation, installation (or why it is inappropriate), a
first use in a named file/handler, expected result, and the next guide. Private
fixtures explain their repository role instead of inventing consumer setup.
Name credentials/assets and valid placeholders before examples. Review lifecycle,
cancellation, denial, failure, and disposal where encountered; invented setup and
empty error handlers do not close gaps.

Preserve anchors or update inbound links and recipe mappings when reorganizing.

## Maintain with each change

The author changing a public API, package setup, or support boundary owns the
affected docs in that change. The reviewer checks the reader's path, not just
the wording diff. A docs-only correction has the same obligations for the
claims and examples it changes.

1. **Find the affected path.** Check the owning README, public guide, recipe,
   maintained example, and relevant Octane skill reference. Inspect declarations,
   CLI help, configuration, and tests before changing technical claims.
2. **Repair the canonical explanation.** Replace stale guidance in place.
   Update introductions and links that depend on it; avoid appending another
   qualification paragraph to an already contradictory page.
3. **Read as the intended reader.** Follow prerequisite links and mentally
   execute the example. Check each of the six dimensions above. For onboarding,
   simulate a fresh app rather than relying on the framework workspace.
4. **Verify proportionately.** Run the checks below. Typecheck changed executable
   examples in their stated context; use maintained fixtures for complex
   examples. Run relevant behavior checks when behavior claims change.
5. **Report evidence and gaps.** Name the paths or workflows improved, commands
   run, actual runtime targets, and remaining blockers. Record audits in Silo;
   do not call a syntax parse a typecheck or a docs build a device test.

## Automated checks and their limits

Run from the repository root:

```sh
pnpm check:docs
pnpm check:doc-examples
pnpm check:recipes
pnpm exec turbo run test:docs --filter=//
pnpm exec turbo run build test --filter=@xplat/docs
```

`check:docs` covers all public Markdown guides and package READMEs, plus the
repository entry points and this policy. It rejects missing published-package
READMEs, missing/duplicate titles, missing public summaries, unclosed or
unlabeled fences, broken local paths/heading links, stale links to this docs
site, duplicate public slugs, and pages absent from the curated reading order.
It uses the site's heading parser for site anchors. It makes no network calls
and runs without installed dependencies in the PR hygiene job.

`check:doc-examples` parses the supported code-fence languages with the
workspace compilers. It catches malformed syntax and mislabeled TSRX; it does
not resolve imports, prove lifecycle correctness, validate remote assets, or
run examples. The docs build checks publishing; rendered-text tests check the
site's Markdown behavior. Browser/device checks are separate and stay out of
the lightweight PR gate. Follow applicable visual-analysis permissions.

For package edits, also run the touched-package/dependents typecheck required
by [AGENTS.md](../../AGENTS.md). A failed check needs a repair or a specific,
reported limitation; never add a blanket allowlist or change a code fence to
`text` merely to hide invalid executable code. `text` is for actual output,
file trees, and explicitly non-executable notation.

The checker deliberately does not grade tone, count adjectives, require a
minimum length, test external URL uptime, or infer correctness from keywords.
Keep human review responsible for those judgments. Add a mechanical rule only
when it detects a concrete defect reliably and has a regression fixture.

## Revisit the whole collection

Before a stable release, review the new-app path and changed workflows. Once
per month of active development, inventory the corpus and rotate through a
topic, prioritizing reported friction, new packages, changed setup, and large
pages that have accumulated several reader jobs. The contributor performing
the release or audit owns that review; it is not implied to run automatically.

```sh
pnpm check:docs --inventory
silo context
silo table show docs_audit
silo table show recipe_audit
```

The inventory lists every covered file, its sections, length, and example
count to support review selection; these are navigation aids, not quality
scores. Record reviewed revision, reader job, findings, depth of review, and
unverified targets in the existing audit records. Distinguish a corpus scan
from a close reading and from an executed journey. Preserve historical
evidence and other worktrees' in-flight records. Recipe coverage and runtime
verification remain independent under the [recipe contract](recipes/README.md).

An audit should produce focused repairs and a short account of the strongest
remaining gaps. Repeated reader failures should change the owning example,
recipe, or check, so each audit reduces the chance of the same failure.
