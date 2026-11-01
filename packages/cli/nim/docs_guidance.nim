## Installation-scoped guidance; versions come from discovery, never guesses.
import std/[json, strutils, sets]
import ./jsonutil, ./docs_binding, ./provenance

proc tailoredGuidance*(installation: JsonNode): JsonNode =
  var versions, linked: seq[string]
  var seen = initHashSet[string]()
  for package in installation["packages"]:
    let identity = scalarString(field(package,"name")) & "@" & scalarString(field(package,"version"))
    if identity notin seen: versions.add(identity); seen.incl(identity)
    if field(package,"kind") == %"linked": linked.add(identity)
  let resolved = versions.join(", ")
  let entries = newJArray()
  proc section(id, title, body: string) =
    entries.add(%*{"id": id,"title": title,"body": body,"provenance":
      provenance(%*{"source": "project-guidance","scope": "project","match": "exact"})})
  section("capabilities","Discover capabilities before acting",
    "Call the project-status capability first: it reports detected identity, " &
    "resolved framework versions (" & (if resolved == "": "none detected" else: resolved) & "), guidance, " &
    "documentation and index status, supported platforms, and missing prerequisites. " &
    "Treat a missing toolchain or device as reported — never as ready.")
  section("target","Select an explicit app and target",
    "Choose the app and platform target explicitly, or reuse an already bound session. " &
    "Web (Chromium) is the first qualified runtime target; iOS, Android, macOS, Linux " &
    "and Windows each carry their own capability matrix. If two targets are equally " &
    "plausible and change the result, ask the developer to choose.")
  section("inspect","Ground answers in current source and version-matched docs",
    "Search results are leads. Before recommending or changing an API, open the " &
    "version-matched documentation page or the installed package source. Docs bind " &
    "to the installed version (" & (if resolved == "": "unresolved" else: resolved) & "), not latest; " &
    "changed or deleted content must be revalidated before reuse.")
  section("iterate","Run and iterate through the app toolchain",
    "Use the app's own dev target (`xplat dev` for web/Chromium; the platform-specific " &
    "dev command for native targets). A successful build is not a passing runtime " &
    "check: distinguish build completed, app launched, and app ready.")
  section("claims","Qualify every verification claim",
    "Report the check actually performed: platform, target, interaction mechanism " &
    "(handler dispatch, DOM event, or OS input), and build/session identity. Handler " &
    "dispatch cannot prove hit-testing or OS-input journeys, and a passing check on " &
    "one platform never implies parity on another.")
  if linked.len > 0:
    section("linked","Linked framework checkouts are development content",
      linked.join(", ") & " resolve to a local " &
      "checkout, not a release. Their docs come from the checkout's current source " &
      "and are labeled development content — do not cite them as a release version.")
  for note in installation["discrepancies"]:
    section("discrepancy","Resolve the install/lockfile discrepancy",
      scalarString(note) & ". " &
      "Guidance follows the actual installation; reinstall or update the lockfile " &
      "to make the two agree.")
  entries
