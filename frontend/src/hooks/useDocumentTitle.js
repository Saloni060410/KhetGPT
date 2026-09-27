import { useEffect } from 'react'

export default function useDocumentTitle(title) {
  useEffect(() => {
    if (!title || title === 'KhetGPT' || title === 'Home') {
      document.title = 'KhetGPT — Sustainable Fertilizer Usage Optimizer'
    } else {
      document.title = `${title} — KhetGPT`
    }
  }, [title])
}
