import { create } from 'zustand'

// Hindi has been removed as a selectable language (no more toggle in the UI) -- English is
// the only supported language now. This store is kept only so useT.js and the reference
// translators (which both still take a `language` argument) don't need call-site changes.
if (typeof document !== 'undefined' && document.documentElement) {
  document.documentElement.lang = 'en'
}

export const useLanguageStore = create(() => ({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
}))
