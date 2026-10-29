import { create } from 'zustand'
import i18n from '@/i18n'
import viVN from 'antd/locale/vi_VN'
import enUS from 'antd/locale/en_US'
import type { Locale } from 'antd/es/locale'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import 'dayjs/locale/en'

export type SupportedLocale = 'vi' | 'en'

interface LocaleState {
  locale: SupportedLocale
  antdLocale: Locale
  setLocale: (locale: SupportedLocale) => void
}

export const STORAGE_KEY = 'cutting_language'

const getInitialLocale = (): SupportedLocale => {
  if (typeof window === 'undefined') return 'vi'
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'en' || saved === 'vi') {
    return saved
  }
  return 'vi'
}

const initialLocale = getInitialLocale()
dayjs.locale(initialLocale === 'vi' ? 'vi' : 'en')

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: initialLocale,
  antdLocale: initialLocale === 'en' ? enUS : viVN,
  setLocale: (locale: SupportedLocale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, locale)
    }
    i18n.changeLanguage(locale)
    dayjs.locale(locale === 'vi' ? 'vi' : 'en')
    set({
      locale,
      antdLocale: locale === 'en' ? enUS : viVN,
    })
  },
}))
