import { useEffect, Suspense, lazy } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import Shell from './components/layout/Shell.jsx'
import RequireAuth from './components/layout/RequireAuth.jsx'
import RouteErrorBoundary from './components/layout/RouteErrorBoundary.jsx'
import { useUserStore } from './store/useUserStore.js'

// Home page statically loaded for immediate initial delivery
import HomePage from './pages/HomePage.jsx'

// Lazy-loaded pages to keep the initial JS bundle minimal and code-split
const OptimizerPage = lazy(() => import('./pages/OptimizerPage.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const SoilInput = lazy(() => import('./pages/SoilInput.jsx'))
const Recommendation = lazy(() => import('./pages/Recommendation.jsx'))
const History = lazy(() => import('./pages/History.jsx'))
const Schedule = lazy(() => import('./pages/Schedule.jsx'))
const RiskCheck = lazy(() => import('./pages/RiskCheck.jsx'))
const FieldProfile = lazy(() => import('./pages/FieldProfile.jsx'))
const Login = lazy(() => import('./pages/Auth/Login.jsx'))
const Register = lazy(() => import('./pages/Auth/Register.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))
import ServerError from './pages/ServerError.jsx'

function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
      <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
    </div>
  )
}

export default function App() {
  const { hydrate } = useUserStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Current UI as the Home Page & Field Optimizer */}
          <Route path="/" element={<HomePage />} />
          <Route path="/optimizer" element={<OptimizerPage />} />
          <Route path="/recommendation" element={<Navigate to="/fields/1/recommendation" replace />} />
          <Route path="/prescription" element={<Navigate to="/fields/1/recommendation" replace />} />

          {/* Core KhetGPT App Pages with standard Shell & Navigation */}
          <Route
            path="/login"
            element={
              <Shell>
                <Login />
              </Shell>
            }
          />
          <Route
            path="/register"
            element={
              <Shell>
                <Register />
              </Shell>
            }
          />

          {/* Core Authenticated App Pages for Farmers Who Log In */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Shell>
                  <Dashboard />
                </Shell>
              </RequireAuth>
            }
          />
          <Route
            path="/fields/:fieldId"
            element={
              <RequireAuth>
                <Shell>
                  <FieldProfile />
                </Shell>
              </RequireAuth>
            }
          />
          <Route
            path="/fields/:fieldId/soil"
            element={
              <RequireAuth>
                <Shell>
                  <SoilInput />
                </Shell>
              </RequireAuth>
            }
          />
          <Route
            path="/fields/:fieldId/recommendation"
            element={
              <RequireAuth>
                <Shell>
                  <Recommendation />
                </Shell>
              </RequireAuth>
            }
          />
          <Route
            path="/fields/:fieldId/schedule"
            element={
              <RequireAuth>
                <Shell>
                  <Schedule />
                </Shell>
              </RequireAuth>
            }
          />
          <Route
            path="/fields/:fieldId/risk-check"
            element={
              <RequireAuth>
                <Shell>
                  <RiskCheck />
                </Shell>
              </RequireAuth>
            }
          />
          <Route
            path="/fields/:fieldId/history"
            element={
              <RequireAuth>
                <Shell>
                  <History />
                </Shell>
              </RequireAuth>
            }
          />

          {/* Error Pages */}
          <Route
            path="/404"
            element={
              <Shell>
                <NotFound />
              </Shell>
            }
          />
          <Route
            path="/500"
            element={
              <Shell>
                <ServerError />
              </Shell>
            }
          />

          {/* 404 Catch-All */}
          <Route
            path="*"
            element={
              <Shell>
                <NotFound />
              </Shell>
            }
          />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  )
}
