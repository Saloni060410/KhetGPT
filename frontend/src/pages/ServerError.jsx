import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, RotateCcw, Home, LayoutDashboard, ChevronDown, ChevronUp } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import { useT } from '../i18n/useT.js'

export default function ServerError({ error, resetErrorBoundary }) {
  const { t } = useT()
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  const handleRetry = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg p-6 sm:p-8 text-center space-y-6 shadow-md border-border-default">
        {/* Visual Badge & Icon */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-risk-high-bg border border-risk-high-border flex items-center justify-center text-risk-high-text shadow-sm">
            <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
          </div>
          <Badge variant="danger" size="sm" className="font-mono tracking-wider font-bold">
            {t('errors.serverErrorCode')} • {t('errors.serverErrorSubtitle')}
          </Badge>
        </div>

        {/* Heading & Explanation */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink-primary tracking-tight">
            {t('errors.serverErrorTitle')}
          </h1>
          <p className="text-sm text-ink-secondary max-w-md mx-auto leading-relaxed">
            {t('errors.serverErrorDesc')}
          </p>
        </div>

        {/* System Engine Health Indicator */}
        <div className="bg-bg-subtle border border-border-subtle rounded-xl p-3 text-xs font-mono text-left flex items-center justify-between">
          <div className="flex items-center space-x-2 text-ink-primary">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t('errors.systemStatus')}</span>
          </div>
          <span className="text-risk-high-text font-bold">HTTP 500</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            leftIcon={RotateCcw}
            onClick={handleRetry}
            className="w-full sm:w-auto justify-center"
          >
            {t('errors.retryAction')}
          </Button>
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" size="md" leftIcon={LayoutDashboard} className="w-full justify-center">
              {t('errors.goToDashboard')}
            </Button>
          </Link>
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="ghost" size="md" leftIcon={Home} className="w-full justify-center">
              {t('errors.backToHome')}
            </Button>
          </Link>
        </div>

        {/* Optional Collapsible Technical Trace */}
        {error && (
          <div className="pt-2 text-left border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full flex items-center justify-between text-xs font-mono text-ink-muted hover:text-ink-primary py-1 transition-colors"
            >
              <span>Diagnostic Trace &amp; Error Context</span>
              {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showTechnicalDetails && (
              <pre className="mt-2 p-3 bg-bg-base border border-border-subtle rounded-lg text-[11px] font-mono text-risk-high-text overflow-x-auto whitespace-pre-wrap">
                {error.stack || error.message || String(error)}
              </pre>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
