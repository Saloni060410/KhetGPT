import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  UserPlus,
  ArrowRight,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Sprout,
  Briefcase,
} from 'lucide-react'
import PageShell from '../../components/ui/PageShell.jsx'
import FormField from '../../components/ui/FormField.jsx'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'
import { useUserStore } from '../../store/useUserStore.js'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'FARMER',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { register } = useUserStore()

  // Validate form fields inline
  const validate = () => {
    const errors = {}

    if (!formData.name.trim()) {
      errors.name = 'Full name is required.'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.'
    }

    if (!formData.password) {
      errors.password = 'Password is required.'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    }

    if (!['FARMER', 'AGRONOMIST'].includes(formData.role)) {
      errors.role = 'Please select a valid role.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }))
    }
    if (apiError) {
      setApiError(null)
    }
  }

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }))
    if (fieldErrors.role) {
      setFieldErrors((prev) => ({ ...prev, role: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setApiError(null)

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      })

      // Redirect back to intended origin or default to /dashboard
      const destination = location.state?.from?.pathname || '/dashboard'
      navigate(destination, { replace: true })
    } catch (err) {
      // Input is preserved in formData state; display API error message (e.g. 409 conflict)
      setApiError(err.message || 'Registration failed. Please verify your details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageShell
      title="Create your KhetGPT Account"
      description="Start optimizing fertilizer usage, computing transparent nutrient deficits, and tracking soil health."
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
              <strong className="font-bold">Registration error: </strong>
              <span>{apiError}</span>
            </div>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Role Choice Selector */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink-primary block">
              Choose your Account Role <span className="text-risk-high-text">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Role selection">
              {/* Farmer Option */}
              <button
                type="button"
                role="radio"
                aria-checked={formData.role === 'FARMER'}
                onClick={() => handleRoleSelect('FARMER')}
                className={`
                  p-3.5 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer min-h-touch
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600
                  ${
                    formData.role === 'FARMER'
                      ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-600/20'
                      : 'border-border-default bg-bg-surface hover:bg-bg-subtle'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      formData.role === 'FARMER'
                        ? 'bg-primary-600 text-white'
                        : 'bg-bg-subtle text-ink-secondary'
                    }`}
                  >
                    <Sprout className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-ink-primary">Farmer</span>
                </div>
                <p className="text-xs text-ink-secondary leading-snug">
                  Optimize fertilizer for your own fields and soil health.
                </p>
              </button>

              {/* Agronomist Option */}
              <button
                type="button"
                role="radio"
                aria-checked={formData.role === 'AGRONOMIST'}
                onClick={() => handleRoleSelect('AGRONOMIST')}
                className={`
                  p-3.5 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer min-h-touch
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600
                  ${
                    formData.role === 'AGRONOMIST'
                      ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-600/20'
                      : 'border-border-default bg-bg-surface hover:bg-bg-subtle'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      formData.role === 'AGRONOMIST'
                        ? 'bg-primary-600 text-white'
                        : 'bg-bg-subtle text-ink-secondary'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-ink-primary">Agronomist</span>
                </div>
                <p className="text-xs text-ink-secondary leading-snug">
                  Advise farmers, review soil tests, and analyze trends.
                </p>
              </button>
            </div>
            {fieldErrors.role && (
              <p role="alert" className="text-xs font-medium text-risk-high-text mt-1">
                {fieldErrors.role}
              </p>
            )}
          </div>

          {/* Full Name */}
          <FormField
            id="register-name"
            label="Full Name"
            required
            error={fieldErrors.name}
          >
            <Input
              name="name"
              placeholder="e.g. Ramesh Patel"
              value={formData.name}
              onChange={handleChange}
              leftIcon={User}
              disabled={isSubmitting}
            />
          </FormField>

          {/* Email Address */}
          <FormField
            id="register-email"
            label="Email Address"
            required
            error={fieldErrors.email}
          >
            <Input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="farmer@khetgpt.in"
              value={formData.email}
              onChange={handleChange}
              leftIcon={Mail}
              disabled={isSubmitting}
            />
          </FormField>

          {/* Password */}
          <FormField
            id="register-password"
            label="Create Password"
            required
            hint="Minimum 8 characters"
            error={fieldErrors.password}
          >
            <div className="relative w-full">
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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
            leftIcon={UserPlus}
            rightIcon={ArrowRight}
            className="w-full justify-center mt-2"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Create {formData.role === 'AGRONOMIST' ? 'Agronomist' : 'Farmer'} Account
          </Button>
        </form>

        {/* Login Callout */}
        <p className="text-sm text-center text-ink-secondary mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary-600 font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-sm"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </PageShell>
  )
}
