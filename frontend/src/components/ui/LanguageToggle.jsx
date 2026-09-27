import React from 'react'
import { Languages } from 'lucide-react'
import { useLanguageStore } from '../../store/useLanguageStore.js'

/**
 * LanguageToggle Component (PRD Feature 11)
 * Accessible English / Hindi toggle button with persistent state.
 */
export default function LanguageToggle({ className = '', compact = false }) {
  const { language, setLanguage } = useLanguageStore()
  const isHindi = language === 'hi'

  return (
    <div
      role="group"
      aria-label="Language selector / भाषा चुनें"
      className={`inline-flex items-center p-0.5 rounded-lg bg-bg-subtle border border-border-default shrink-0 select-none ${className}`}
    >
      {/* English Option */}
      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={!isHindi}
        title="Switch to English"
        className={`px-2 py-1 rounded-md text-xs font-bold transition-all min-h-[30px] flex items-center justify-center cursor-pointer ${
          !isHindi
            ? 'bg-bg-surface text-primary-700 dark:text-primary-400 shadow-xs border border-border-default/60 font-black'
            : 'text-ink-secondary hover:text-ink-primary'
        }`}
      >
        <span>EN</span>
      </button>

      {/* Hindi Option */}
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        aria-pressed={isHindi}
        title="हिंदी में बदलें (Switch to Hindi)"
        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all min-h-[30px] flex items-center justify-center cursor-pointer ${
          isHindi
            ? 'bg-primary-700 text-white shadow-xs font-black'
            : 'text-ink-secondary hover:text-ink-primary'
        }`}
      >
        <span>हिन्दी</span>
      </button>
    </div>
  )
}
