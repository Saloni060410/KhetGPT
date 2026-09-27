import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Shell from './components/layout/Shell.jsx'
import RequireAuth from './components/layout/RequireAuth.jsx'
import RouteErrorBoundary from './components/layout/RouteErrorBoundary.jsx'
import { useUserStore } from './store/useUserStore.js'

// Current UI pages (Home & Optimizer)
import HomePage from './pages/HomePage.jsx'
import OptimizerPage from './pages/OptimizerPage.jsx'

// Core KhetGPT application pages
import Dashboard from './pages/Dashboard.jsx'
import SoilInput from './pages/SoilInput.jsx'
import Recommendation from './pages/Recommendation.jsx'
import History from './pages/History.jsx'
import Schedule from './pages/Schedule.jsx'
import RiskCheck from './pages/RiskCheck.jsx'
import FieldProfile from './pages/FieldProfile.jsx'
import Login from './pages/Auth/Login.jsx'
import Register from './pages/Auth/Register.jsx'
import NotFound from './pages/NotFound.jsx'
import ServerError from './pages/ServerError.jsx'
import Kit from './pages/Kit.jsx'

export default function App() {
  const { hydrate } = useUserStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <RouteErrorBoundary>
      <Routes>
        {/* Current UI as the Home Page & Field Optimizer (Full-screen dark mode layouts) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/optimizer" element={<OptimizerPage />} />

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
        <Route
          path="/kit"
          element={
            <Shell>
              <Kit />
            </Shell>
          }
        />

        {/* Protected App Routes */}
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
    </RouteErrorBoundary>
  )
}
