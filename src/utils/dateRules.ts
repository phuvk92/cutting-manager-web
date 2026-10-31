import dayjs, { Dayjs } from 'dayjs'

/**
 * Business rule: Group A dates must not be in the past.
 * Disables any date strictly before the beginning of today in Ant Design DatePicker.
 * Today and future dates return false (meaning selectable).
 */
export const disablePastDates = (current: Dayjs | null): boolean => {
  if (!current) return false
  return current.isBefore(dayjs().startOf('day'))
}

/**
 * Disables dates before a minimum threshold (defaults to today).
 * If minDate is provided and is in the future, dates before minDate are disabled.
 * If minDate is in the past or not provided, dates before today are disabled.
 */
export const disableDatesBefore = (
  current: Dayjs | null,
  minDate?: Dayjs | string | null
): boolean => {
  if (!current) return false
  const today = dayjs().startOf('day')
  if (!minDate) {
    return current.isBefore(today)
  }
  const min = dayjs(minDate).startOf('day')
  const effectiveMin = min.isAfter(today) ? min : today
  return current.isBefore(effectiveMin)
}

/**
 * Validates whether a date string (YYYY-MM-DD) is not in the past.
 * If initialDate is provided and matches val (case: preserving old past date in edit mode),
 * it is considered valid.
 */
export const isNotPastDate = (
  val?: string | null,
  initialDate?: string | null
): boolean => {
  if (!val) return true
  if (initialDate && (val === initialDate || dayjs(val).isSame(dayjs(initialDate), 'day'))) {
    return true
  }
  const d = dayjs(val, 'YYYY-MM-DD', true)
  if (!d.isValid()) return false
  return !d.isBefore(dayjs().startOf('day'))
}

/**
 * Validates whether endDate is not before startDate (YYYY-MM-DD).
 */
export const isDateRangeValid = (
  startDate?: string | null,
  endDate?: string | null
): boolean => {
  if (!startDate || !endDate) return true
  const start = dayjs(startDate, 'YYYY-MM-DD', true)
  const end = dayjs(endDate, 'YYYY-MM-DD', true)
  if (!start.isValid() || !end.isValid()) return true
  return !end.isBefore(start, 'day')
}
