# Calendar and calendar hooks

Current exports: `Calendar`, `useCalendarDays`, `useCalendarConstraints`, `useCalendarNavigation`, `isSameDay`, `isDateInRange`, `getWeekNumber`.

**Design: Keep the single/range union and use calendar dates throughout constraints.**

Calendar already discriminates mode correctly; keep that design. Values use ISO calendar-date strings, but dateConstraints receives JavaScript Date and single onChange returns an extra Date argument. A timezone-bearing type inside a calendar-date API adds conversion mistakes. Use one validated calendar-date type and expose conversion as an explicit helper.

Proposed shape (illustrative):

```ts
type ProposedCalendarDate = { year: number; month: number; day: number }
type ProposedDateConstraint = (date: ProposedCalendarDate) => boolean
```

Evidence: [src/props.ts:700](../../../../packages/ui/src/props.ts#L700), [src/props.ts:737](../../../../packages/ui/src/props.ts#L737).

[Audit index](../../README.md)
