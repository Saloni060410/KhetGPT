import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useUserStore } from '../../store/useUserStore.js'
import Skeleton from '../ui/Skeleton.jsx'

export default function RequireAuth({ children }) {
  const { isAuthenticated, isHydrated, hydrate } = useUserStore()
  const location = useLocation()

  useEffect(() => {
    if (!isHydrated) {
      hydrate()
    }
  }, [isHydrated, hydrate])

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-bg-base">
        <div className="w-full max-w-md p-6 bg-bg-surface border border-border-default rounded-2xl shadow-sm space-y-4">
          <Skeleton variant="rect" height="32px" width="60%" />
          <Skeleton variant="text" />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="rect" height="44px" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
