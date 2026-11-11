// Pure dev-server targeting rule for the desktop shell — deliberately
// non-suffixed so Node tests import it and no `.macos.ts` sibling shadows it.
import type { ListedDevtoolsServer } from '../record.ts'

function normalizeRoot(path: string): string {
  let end = path.length
  while (end > 1 && path[end - 1] === '/') {
    end--
  }
  return path.slice(0, end)
}

// Order: an explicit preferred root (the app `xplat devtools` ran from) wins;
// a sole record auto-targets; otherwise the picker decides. Both sides are
// canonical real paths — Go writes appRoot through osfs.Canonical and the
// launcher realpaths the selected project — so trailing-slash
// normalization is defensive only.
export function autoTarget(
  records: ListedDevtoolsServer[],
  preferredRoot: string | null,
): ListedDevtoolsServer | null {
  if (preferredRoot) {
    const root = normalizeRoot(preferredRoot)
    const match = records.find((record) => normalizeRoot(record.appRoot) === root)
    if (match) {
      return match
    }
  }
  return records.length === 1 ? records[0] : null
}
