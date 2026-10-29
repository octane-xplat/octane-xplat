### Pick options from a popover on GTK

GTK 4.14+ apps can now import Selector and MultiSelector from the shared UI
root. The finite-list menu opens in a native popup anchored to the trigger:
selection, controlled or uncontrolled value, searchable filtering,
select-all, clearing, disabled options and Field integration all follow the
shared contract.

```tsx
import { useState } from 'octane'
import { MultiSelector, Selector } from '@octane-xplat/ui'

const people = [
  { value: 'ada', label: 'Ada' },
  { value: 'sam', label: 'Sam' },
]

export function Assignment() {
  const [who, setWho] = useState<string | null>(null)
  const [reviewers, setReviewers] = useState<string[]>([])
  return (
    <>
      <Selector label="Assignee" options={people} value={who} onValueChange={setWho} searchable />
      <MultiSelector label="Reviewers" options={people} value={reviewers} onValueChange={setReviewers} hasSelectAll />
    </>
  )
}
```

Escape and outside taps request dismissal; focus returns to the trigger.
Arrow-key list navigation remains a web-only feature for now. [GTK setup
and limits](https://octane-xplat.goddardai.org/linux-gtk#choose-one-or-many-options).
