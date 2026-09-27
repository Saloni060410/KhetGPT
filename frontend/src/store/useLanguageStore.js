import { create } from 'zustand'

const STORAGE_KEY = 'khetgpt_lang'

let devanagariLoaded = false

/**
 * Dynamically loads the Devanagari font stylesheets ONLY when Hindi is selected.
 * Keeps English sessions lightweight without unnecessary font downloads.
 */
export async function loadDevanagariFont() {
  if (devanagariLoaded || typeof window === 'undefined') return
  devanagariLoaded = true

  try {
    await Promise.all([
      import('@fontsource/noto-sans-devanagari/400.css'),
      import('@fontsource/noto-sans-devanagari/500.css'),
      import('@fontsource/noto-sans-devanagari/600.css'),
      import('@fontsource/noto-sans-devanagari/700.css'),
    ])
  } catch (err) {
    console.warn('Notice: Could not dynamically load Devanagari font:', err)
  }
}

/**
 * Safely retrieve persisted language with try/catch
 */
function getInitialLanguage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === 'hi' || stored === 'en') {
        return stored
      }
    }
  } catch (err) {
    console.warn('Notice: Unable to access localStorage for language preference:', err)
  }
  return 'en'
}

/**
 * Safely persist language with try/catch
 */
function persistLanguage(lang) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, lang)
    }
  } catch (err) {
    console.warn('Notice: Unable to save language preference to localStorage:', err)
  }
}

/**
 * Keep the <html lang="..."> attribute synchronized
 */
function syncHtmlLang(lang) {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = lang
  }
}

// Initial bootstrap
const initialLang = getInitialLanguage()
syncHtmlLang(initialLang)
if (initialLang === 'hi') {
  loadDevanagariFont()
}

/**
 * Zustand Language Store for KhetGPT (PRD Feature 11)
 */
export const useLanguageStore = create((set, get) => ({
  language: initialLang,

  setLanguage: (lang) => {
    const nextLang = lang === 'hi' ? 'hi' : 'en'
    persistLanguage(nextLang)
    syncHtmlLang(nextLang)

    if (nextLang === 'hi') {
      loadDevanagariFont()
    }

    set({ language: nextLang })
  },

  toggleLanguage: () => {
    const next = get().language === 'en' ? 'hi' : 'en'
    get().setLanguage(next)
  },
}))
