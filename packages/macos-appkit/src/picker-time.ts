/** Shared time-of-day values discard calendar dates, seconds and milliseconds. */
export function timeOfDay(value: Date | string): Date {
  if (typeof value === 'string') {
    const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value)

    if (
      !match ||
      match[0] !== value ||
      Number(match[1]) > 23 ||
      Number(match[2]) > 59 ||
      Number(match[3] ?? 0) > 59
    ) {
      throw new TypeError(
        'AppKit timepicker time must be a valid Date or 24-hour HH:mm[:ss] string',
      )
    }

    return new Date(0, 0, 0, Number(match[1]), Number(match[2]))
  }

  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new TypeError(
      'AppKit timepicker time must be a valid Date or 24-hour HH:mm[:ss] string',
    )
  }

  return new Date(0, 0, 0, value.getHours(), value.getMinutes())
}
