import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import {
  disablePastDates,
  disableDatesBefore,
  isNotPastDate,
  isDateRangeValid,
} from './dateRules'

describe('dateRules utils', () => {
  describe('disablePastDates', () => {
    it('disables yesterday and earlier', () => {
      const yesterday = dayjs().subtract(1, 'day')
      expect(disablePastDates(yesterday)).toBe(true)
    })

    it('allows today', () => {
      const today = dayjs()
      expect(disablePastDates(today)).toBe(false)
    })

    it('allows future dates', () => {
      const tomorrow = dayjs().add(1, 'day')
      expect(disablePastDates(tomorrow)).toBe(false)
    })

    it('handles null/undefined gracefully', () => {
      expect(disablePastDates(null)).toBe(false)
    })
  })

  describe('disableDatesBefore', () => {
    it('disables dates before minDate when minDate is in the future', () => {
      const minDate = dayjs().add(5, 'day').format('YYYY-MM-DD')
      const targetBeforeMin = dayjs().add(3, 'day')
      const targetOnMin = dayjs().add(5, 'day')
      const targetAfterMin = dayjs().add(6, 'day')

      expect(disableDatesBefore(targetBeforeMin, minDate)).toBe(true)
      expect(disableDatesBefore(targetOnMin, minDate)).toBe(false)
      expect(disableDatesBefore(targetAfterMin, minDate)).toBe(false)
    })

    it('defaults to today when minDate is not provided', () => {
      const yesterday = dayjs().subtract(1, 'day')
      expect(disableDatesBefore(yesterday, null)).toBe(true)
      expect(disableDatesBefore(dayjs(), null)).toBe(false)
    })

    it('enforces today if minDate is in the past', () => {
      const pastMinDate = dayjs().subtract(10, 'day').format('YYYY-MM-DD')
      const yesterday = dayjs().subtract(1, 'day')
      expect(disableDatesBefore(yesterday, pastMinDate)).toBe(true)
      expect(disableDatesBefore(dayjs(), pastMinDate)).toBe(false)
    })
  })

  describe('isNotPastDate', () => {
    it('returns true for empty or null date', () => {
      expect(isNotPastDate(null)).toBe(true)
      expect(isNotPastDate(undefined)).toBe(true)
      expect(isNotPastDate('')).toBe(true)
    })

    it('returns false for past date when no initialDate matches', () => {
      const past = dayjs().subtract(2, 'day').format('YYYY-MM-DD')
      expect(isNotPastDate(past)).toBe(false)
    })

    it('returns true for today and future date', () => {
      const today = dayjs().format('YYYY-MM-DD')
      const future = dayjs().add(30, 'day').format('YYYY-MM-DD')
      expect(isNotPastDate(today)).toBe(true)
      expect(isNotPastDate(future)).toBe(true)
    })

    it('preserves old past date if unchanged in edit mode', () => {
      const oldPast = '2023-01-15'
      expect(isNotPastDate(oldPast, oldPast)).toBe(true)
    })

    it('rejects past date if changed to another past date', () => {
      const oldPast = '2023-01-15'
      const newPast = '2023-05-20'
      expect(isNotPastDate(newPast, oldPast)).toBe(false)
    })
  })

  describe('isDateRangeValid', () => {
    it('returns true when startDate or endDate is missing', () => {
      expect(isDateRangeValid(null, '2026-12-01')).toBe(true)
      expect(isDateRangeValid('2026-12-01', null)).toBe(true)
    })

    it('returns true when endDate is on or after startDate', () => {
      expect(isDateRangeValid('2026-11-01', '2026-11-01')).toBe(true)
      expect(isDateRangeValid('2026-11-01', '2026-11-10')).toBe(true)
    })

    it('returns false when endDate is before startDate', () => {
      expect(isDateRangeValid('2026-11-10', '2026-11-01')).toBe(false)
    })
  })
})
