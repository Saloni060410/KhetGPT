/**
 * Offline-friendly Cache Utility (PRD Feature 15)
 * Caches recommendations, schedules, and reference data in localStorage
 * with full try-catch guards to handle storage errors gracefully.
 */

const STORAGE_PREFIX = 'khetgpt_offline_'

export function getOfflineItem(key) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setOfflineItem(key, data) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    const payload = {
      data,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

export function cacheRecommendation(fieldId, recommendation) {
  if (!recommendation) return
  setOfflineItem(`rec_${fieldId}`, recommendation)
  setOfflineItem('rec_latest', recommendation)
}

export function getCachedRecommendation(fieldId) {
  return getOfflineItem(`rec_${fieldId}`) || getOfflineItem('rec_latest')
}

export function cacheSchedule(fieldId, scheduleData) {
  if (!scheduleData) return
  setOfflineItem(`schedule_${fieldId}`, scheduleData)
}

export function getCachedSchedule(fieldId) {
  return getOfflineItem(`schedule_${fieldId}`)
}

export function cacheReferenceList(type, list) {
  if (!list) return
  setOfflineItem(`ref_${type}`, list)
}

export function getCachedReferenceList(type) {
  return getOfflineItem(`ref_${type}`)
}

export function isDeviceOffline() {
  if (typeof navigator === 'undefined') return false
  return !navigator.onLine
}
