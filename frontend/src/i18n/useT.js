import { useCallback } from 'react'
import { useLanguageStore } from '../store/useLanguageStore.js'
import en from './en.js'
import hi from './hi.js'
import {
  getCropName,
  getVarietyName,
  getStageName,
  getFertilizerName,
} from './referenceTranslators.js'

const dictionaries = { en, hi }

/**
 * Helper to traverse nested object by dot-separated path (e.g., 'nav.dashboard')
 */
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined
  const parts = path.split('.')
  let current = obj
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part]
    } else {
      return undefined
    }
  }
  return current
}

/**
 * Interpolate {param} in string templates
 */
function interpolate(template, params = {}) {
  if (typeof template !== 'string') return template
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match
  })
}

/**
 * useT() Hook (PRD Feature 11)
 * Lightweight multilingual hook backed by Zustand with localStorage persistence.
 */
export function useT() {
  const { language, setLanguage, toggleLanguage } = useLanguageStore()

  /**
   * Main translation function
   * @param {string} key - Dot-separated translation key (e.g. 'common.save')
   * @param {object} [params] - Optional interpolation parameters (e.g. { count: 3 })
   */
  const t = useCallback(
    (key, params = {}) => {
      const activeDict = dictionaries[language] || dictionaries.en
      let val = getNestedValue(activeDict, key)

      // Fallback to English if not found in active language
      if (val === undefined && language !== 'en') {
        val = getNestedValue(dictionaries.en, key)
      }

      if (val === undefined) {
        // Return key if missing in both
        return key
      }

      return interpolate(val, params)
    },
    [language],
  )

  /**
   * Localized date formatter
   */
  const formatDate = useCallback(
    (dateStr, options = {}) => {
      if (!dateStr) return t('common.tbd')
      try {
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return String(dateStr)
        const locale = language === 'hi' ? 'hi-IN' : 'en-IN'
        return new Intl.DateTimeFormat(locale, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          ...options,
        }).format(d)
      } catch {
        return String(dateStr)
      }
    },
    [language, t],
  )

  /**
   * Localized number formatter
   */
  const formatNumber = useCallback(
    (val, options = {}) => {
      if (val == null || isNaN(val)) return '0'
      try {
        const locale = language === 'hi' ? 'hi-IN' : 'en-IN'
        return new Intl.NumberFormat(locale, options).format(val)
      } catch {
        return String(val)
      }
    },
    [language],
  )

  /**
   * Localized Indian Rupee currency formatter
   */
  const formatCurrency = useCallback(
    (val) => {
      if (val == null || isNaN(val)) return null
      try {
        const locale = language === 'hi' ? 'hi-IN' : 'en-IN'
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(val)
      } catch {
        return `₹${val}`
      }
    },
    [language],
  )

  /**
   * Reference table formatters from Richa's tables
   */
  const formatCrop = useCallback(
    (cropKey) => getCropName(cropKey, language),
    [language],
  )

  const formatVariety = useCallback(
    (cropKey, varietyKey) => getVarietyName(cropKey, varietyKey, language),
    [language],
  )

  const formatStage = useCallback(
    (stageKey, cropKey) => getStageName(stageKey, cropKey, language),
    [language],
  )

  const formatFertilizer = useCallback(
    (fertKey) => getFertilizerName(fertKey, language),
    [language],
  )

  return {
    t,
    language,
    setLanguage,
    toggleLanguage,
    isHindi: language === 'hi',
    formatDate,
    formatNumber,
    formatCurrency,
    formatCrop,
    formatVariety,
    formatStage,
    formatFertilizer,
  }
}

export default useT
