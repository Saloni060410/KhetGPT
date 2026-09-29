import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore.js'
import { usePlotStore } from '../store/usePlotStore.js'

/**
 * The field the user is "in": the :fieldId in the URL when there is one, otherwise their first
 * real field. fieldPath('/soil') gives a link that always points at a real field, and falls back
 * to /dashboard (where a field is registered) for an account that has none yet.
 */
export function useActiveField() {
  const { fieldId: routeFieldId } = useParams()
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const plots = usePlotStore((s) => s.plots)
  const status = usePlotStore((s) => s.status)
  const loadPlots = usePlotStore((s) => s.loadPlots)

  useEffect(() => {
    if (isAuthenticated) loadPlots()
  }, [isAuthenticated, loadPlots])

  const fieldId = routeFieldId || plots[0]?.field.id || null
  const fieldPath = (suffix = '') => (fieldId ? `/fields/${fieldId}${suffix}` : '/dashboard')
  const activePlot = plots.find((p) => String(p.field.id) === String(fieldId)) || null

  return { fieldId, fieldPath, plots, status, activePlot }
}
