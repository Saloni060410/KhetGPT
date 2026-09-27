import { Link } from 'react-router-dom'
import { Home, LayoutDashboard, Compass, Sprout, ArrowLeft } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import { useT } from '../i18n/useT.js'

export default function NotFound() {
  const { t } = useT()

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg p-6 sm:p-8 text-center space-y-6 shadow-md border-border-default">
        {/* Visual Badge & Icon */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-700 shadow-sm">
            <Compass className="w-8 h-8 stroke-[1.8]" />
          </div>
          <Badge variant="neutral" size="sm" className="font-mono tracking-wider font-bold">
            {t('errors.notFoundCode')} • {t('errors.notFoundSubtitle')}
          </Badge>
        </div>

        {/* Heading & Explanation */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink-primary tracking-tight">
            {t('errors.notFoundTitle')}
          </h1>
          <p className="text-sm text-ink-secondary max-w-md mx-auto leading-relaxed">
            {t('errors.notFoundDesc')}
          </p>
        </div>

        {/* Diagnostic Path Indicator */}
        <div className="bg-bg-subtle border border-border-subtle rounded-xl p-3 text-xs font-mono text-ink-muted text-left flex items-center justify-between">
          <span className="truncate">Path: {typeof window !== 'undefined' ? window.location.pathname : '/'}</span>
          <span className="text-risk-med-text font-bold">STATUS 404</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="primary" size="md" leftIcon={Home} className="w-full justify-center">
              {t('errors.backToHome')}
            </Button>
          </Link>
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" size="md" leftIcon={LayoutDashboard} className="w-full justify-center">
              {t('errors.goToDashboard')}
            </Button>
          </Link>
        </div>

        {/* Quick Route Shortcuts */}
        <div className="pt-4 border-t border-border-subtle text-xs text-ink-muted">
          <p className="font-semibold text-ink-secondary mb-2">Common Agronomic Links</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/fields/1/recommendation" className="text-primary-700 hover:underline">
              Sample Recommendation
            </Link>
            <span>•</span>
            <Link to="/fields/1/schedule" className="text-primary-700 hover:underline">
              Dealer Schedule
            </Link>
            <span>•</span>
            <Link to="/fields/1/risk-check" className="text-primary-700 hover:underline">
              Plan Risk Check
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
