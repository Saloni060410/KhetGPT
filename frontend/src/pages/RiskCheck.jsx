import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Layers } from 'lucide-react'
import PageShell from '../components/ui/PageShell.jsx'
import PlanRiskChecker from '../components/farms/PlanRiskChecker.jsx'
import { useFarmStore } from '../store/useFarmStore.js'
import { useEffect } from 'react'

export default function RiskCheck() {
  const { fieldId } = useParams()
  const currentFieldId = fieldId || '1'
  const navigate = useNavigate()
  const { currentField, fetchField } = useFarmStore()

  useEffect(() => {
    fetchField(currentFieldId).catch(() => {})
  }, [currentFieldId, fetchField])

  const field = currentField || {
    id: currentFieldId,
    name:
      currentFieldId === '1'
        ? 'North Khet (Wheat)'
        : currentFieldId === '2'
        ? 'East Paddy (Rice)'
        : currentFieldId === '3'
        ? 'South Block (Maize)'
        : currentFieldId === '4'
        ? 'West Plot (Prerequisite Missing)'
        : `Field ${currentFieldId}`,
    areaAcres: currentFieldId === '2' ? 3.0 : currentFieldId === '3' ? 4.0 : 2.5,
    cropType: currentFieldId === '2' ? 'Rice' : currentFieldId === '3' ? 'Maize' : 'Wheat',
  }

  const handleBackToRecommended = () => {
    navigate(`/fields/${currentFieldId}/recommendation`)
  }

  return (
    <PageShell
      title="Check My Own Plan"
      description="Compare custom fertilizer dosages against agronomist safety thresholds before application."
    >
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Navigation & Demo Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to={`/fields/${currentFieldId}/recommendation`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-secondary hover:text-ink-primary min-h-touch py-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Recommended Plan</span>
          </Link>

          {/* Quick Demo Scenario Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-primary-600" />
              Demo:
            </span>
            <Link
              to="/fields/1/risk-check"
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center ${
                currentFieldId === '1'
                  ? 'bg-primary-700 text-ink-inverse shadow-xs'
                  : 'bg-bg-surface border border-border-default text-ink-secondary hover:text-ink-primary'
              }`}
            >
              1. Wheat
            </Link>
            <Link
              to="/fields/2/risk-check"
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center ${
                currentFieldId === '2'
                  ? 'bg-primary-700 text-ink-inverse shadow-xs'
                  : 'bg-bg-surface border border-border-default text-ink-secondary hover:text-ink-primary'
              }`}
            >
              2. Rice
            </Link>
            <Link
              to="/fields/3/risk-check"
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center ${
                currentFieldId === '3'
                  ? 'bg-primary-700 text-ink-inverse shadow-xs'
                  : 'bg-bg-surface border border-border-default text-ink-secondary hover:text-ink-primary'
              }`}
            >
              3. Maize
            </Link>
            <Link
              to="/fields/4/risk-check"
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center ${
                currentFieldId === '4'
                  ? 'bg-primary-700 text-ink-inverse shadow-xs'
                  : 'bg-bg-surface border border-border-default text-ink-secondary hover:text-ink-primary'
              }`}
            >
              4. Test 409 Case
            </Link>
          </div>
        </div>

        {/* Plan Risk Checker Interactive Component */}
        <PlanRiskChecker
          fieldId={currentFieldId}
          onBackToRecommended={handleBackToRecommended}
          fieldArea={field.areaAcres || 2.5}
          cropType={field.cropType || 'Wheat'}
        />
      </div>
    </PageShell>
  )
}
