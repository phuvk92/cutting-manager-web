import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import viCommon from '@/locales/vi/common.json'
import viNav from '@/locales/vi/nav.json'
import viAuth from '@/locales/vi/auth.json'
import viDashboard from '@/locales/vi/dashboard.json'
import viUsers from '@/locales/vi/users.json'
import viDealers from '@/locales/vi/dealers.json'
import viVehicles from '@/locales/vi/vehicles.json'
import viParts from '@/locales/vi/parts.json'
import viPartCategories from '@/locales/vi/partLibraryCategories.json'
import viSavedFiles from '@/locales/vi/savedFiles.json'
import viDevices from '@/locales/vi/devices.json'
import viAudit from '@/locales/vi/audit.json'
import viBulkUpload from '@/locales/vi/bulkUpload.json'
import viErrors from '@/locales/vi/errors.json'

import enCommon from '@/locales/en/common.json'
import enNav from '@/locales/en/nav.json'
import enAuth from '@/locales/en/auth.json'
import enDashboard from '@/locales/en/dashboard.json'
import enUsers from '@/locales/en/users.json'
import enDealers from '@/locales/en/dealers.json'
import enVehicles from '@/locales/en/vehicles.json'
import enParts from '@/locales/en/parts.json'
import enPartCategories from '@/locales/en/partLibraryCategories.json'
import enSavedFiles from '@/locales/en/savedFiles.json'
import enDevices from '@/locales/en/devices.json'
import enAudit from '@/locales/en/audit.json'
import enBulkUpload from '@/locales/en/bulkUpload.json'
import enErrors from '@/locales/en/errors.json'

export const defaultNS = 'common'
export const resources = {
  vi: {
    common: viCommon,
    nav: viNav,
    auth: viAuth,
    dashboard: viDashboard,
    users: viUsers,
    dealers: viDealers,
    vehicles: viVehicles,
    parts: viParts,
    partLibraryCategories: viPartCategories,
    savedFiles: viSavedFiles,
    devices: viDevices,
    audit: viAudit,
    bulkUpload: viBulkUpload,
    errors: viErrors,
  },
  en: {
    common: enCommon,
    nav: enNav,
    auth: enAuth,
    dashboard: enDashboard,
    users: enUsers,
    dealers: enDealers,
    vehicles: enVehicles,
    parts: enParts,
    partLibraryCategories: enPartCategories,
    savedFiles: enSavedFiles,
    devices: enDevices,
    audit: enAudit,
    bulkUpload: enBulkUpload,
    errors: enErrors,
  },
} as const

const STORAGE_KEY = 'cutting_language'
const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
const initialLng = (savedLanguage === 'en' || savedLanguage === 'vi') ? savedLanguage : 'vi'

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLng,
    fallbackLng: 'vi',
    defaultNS,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n
