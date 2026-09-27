import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { LogIn, ArrowRight, Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react'
import PageShell from '../../components/ui/PageShell.jsx'
import FormField from '../../components/ui/FormField.jsx'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'
import { useUserStore } from '../../store/useUserStore.js'

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useUserStore()

  // Validate form fields inline
  const validate = () => {
    const errors = {}
    if (!formData.email.trim()) {
      errors.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.'
    }

    if (!formData.password) {
      errors.password = 'Password is required.'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear inline error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }))
    }
    if (apiError) {
      setApiError(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setApiError(null)

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      })

      // Redirect back to origin route or default to /dashboard
      const destination = location.state?.from?.pathname || '/dashboard'
      navigate(destination, { replace: true })
    } catch (err) {
      // Input is preserved in formData state; display API error message
      setApiError(err.message || 'Invalid email or password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick fill helper for demo convenience
  const fillDemoAccount = (email, password = 'password123') => {
    setFormData({ email, password })
    setFieldErrors({})
    setApiError(null)
  }

  return (
    <PageShell
      title="Sign In to KhetGPT"
      description="Access your farm fields, soil health cards, and fertilizer optimization schedules."
    >
      <div className="max-w-md mx-auto py-2">
        {/* API Error Notification */}
        {apiError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl border border-risk-high-border bg-risk-high-bg text-risk-high-text flex items-start gap-3 shadow-xs animate-in fade-in duration-fast"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm">
              <strong className="font-bold">Authentication failed: </strong>
              <span>{apiError}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <FormField
            id="login-email"
            label="Email Address"
            required
            error={fieldErrors.email}
          >
            <Input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="kisan@khetgpt.in"
              value={formData.email}
              onChange={handleChange}
              leftIcon={Mail}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            id="login-password"
            label="Password"
            required
            error={fieldErrors.password}
          >
            <div className="relative w-full">
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                leftIcon={Lock}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 min-h-touch min-w-touch p-2 inline-flex items-center justify-center text-ink-muted hover:text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-lg cursor-pointer transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Eye className="w-5 h-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            leftIcon={LogIn}
            rightIcon={ArrowRight}
            className="w-full justify-center mt-2"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Sign In
          </Button>
        </form>

        {/* Demo Account Quick-Fill Cards */}
        <div className="mt-8 pt-6 border-t border-border-default space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary-600" />
              Quick Demo Fill
            </span>
            <span className="text-[11px] text-ink-muted">1-click credentials</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fillDemoAccount('kisan@khetgpt.in')}
              className="p-3 text-left rounded-xl border border-border-default bg-bg-surface hover:bg-bg-subtle hover:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 transition-colors cursor-pointer min-h-touch"
            >
              <div className="text-xs font-bold text-ink-primary">Ramesh Patel</div>
              <div className="text-[11px] text-primary-600 font-medium">Farmer Account</div>
              <div className="text-[11px] text-ink-muted mt-0.5 font-mono">kisan@khetgpt.in</div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('agronomist@khetgpt.in')}
              className="p-3 text-left rounded-xl border border-border-default bg-bg-surface hover:bg-bg-subtle hover:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 transition-colors cursor-pointer min-h-touch"
            >
              <div className="text-xs font-bold text-ink-primary">Dr. Priya Sharma</div>
              <div className="text-[11px] text-accent-amber font-medium">Agronomist Account</div>
              <div className="text-[11px] text-ink-muted mt-0.5 font-mono">agronomist@khetgpt.in</div>
            </button>
          </div>
        </div>

        {/* Register Callout */}
        <p className="text-sm text-center text-ink-secondary mt-6">
          Don&apos;t have an account yet?{' '}
          <Link
            to="/register"
            className="text-primary-600 font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-sm"
          >
            Create an account
          </Link>
        </p>
      </div>
    </PageShell>
  )
}
