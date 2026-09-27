import { useState } from 'react'
import {
  Sparkles,
  Search,
  Calendar,
  Send,
  Download,
  Plus,
  ShieldCheck,
  Wheat,
  RotateCcw,
} from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Textarea from '../components/ui/Textarea.jsx'
import FormField from '../components/ui/FormField.jsx'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import RiskBadge from '../components/ui/RiskBadge.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import Toast from '../components/ui/Toast.jsx'
import Modal from '../components/ui/Modal.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

export default function Kit() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showToasts, setShowToasts] = useState({
    success: true,
    warning: true,
    error: true,
    info: true,
  })

  return (
    <div className="min-h-screen bg-bg-base text-ink-primary p-4 sm:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header / Intro */}
        <header className="border-b border-border-default pb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Vibrant Agri-Tech Design System
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-primary tracking-tight">
                KhetGPT Component Kit
              </h1>
              <p className="text-base text-ink-secondary mt-1 max-w-2xl">
                High-contrast, outdoor-resilient component library built for Indian farmers and agronomists.
                Tokens-only styling with guaranteed 44px minimum touch targets and AAA accessibility.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-bg-surface border border-border-default px-3 py-1.5 rounded-lg font-mono text-ink-secondary shadow-xs">
                Tokens: tokens.css
              </span>
            </div>
          </div>
        </header>

        {/* 1. Buttons */}
        <section className="space-y-6">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="text-2xl font-bold text-ink-primary">1. Buttons & Action Targets</h2>
            <p className="text-sm text-ink-secondary">
              Includes primary, secondary, outline, ghost, and danger variants. All sizes maintain min 44px touch targets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardTitle as="h3" className="text-base mb-4">Button Variants (Normal & Icons)</CardTitle>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="primary" leftIcon={Send}>
                  Submit Plan
                </Button>
                <Button variant="secondary" leftIcon={Download}>
                  Download PDF
                </Button>
                <Button variant="outline" leftIcon={Calendar}>
                  View Schedule
                </Button>
                <Button variant="ghost">
                  Cancel
                </Button>
                <Button variant="danger">
                  Delete Field
                </Button>
              </div>
            </Card>

            <Card>
              <CardTitle as="h3" className="text-base mb-4">Interactive States (Disabled, Loading, Sizing)</CardTitle>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="primary" isLoading>
                  Calculating Dose...
                </Button>
                <Button variant="primary" disabled>
                  Disabled Primary
                </Button>
                <Button variant="outline" disabled>
                  Disabled Outline
                </Button>
                <Button variant="secondary" size="sm" leftIcon={Plus}>
                  Small (44px target)
                </Button>
                <Button variant="primary" size="lg">
                  Large Action
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* 2. Risk Badges (Safety Feature) */}
        <section className="space-y-6">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="text-2xl font-bold text-ink-primary">2. Risk Badges (Triple-Coded Safety)</h2>
            <p className="text-sm text-ink-secondary">
              Per PRD rules, risk is never conveyed by color alone. Every badge couples high-contrast color, distinct icon, and explicit text.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-risk-low-text">
              <RiskBadge level="low" size="lg" />
              <div className="mt-3">
                <p className="text-sm font-semibold text-ink-primary">Balanced Application</p>
                <p className="text-xs text-ink-secondary mt-1">
                  Fertilizer recommendation meets crop demand without causing soil acidification or runoff risks.
                </p>
              </div>
            </Card>

            <Card className="border-l-4 border-l-risk-med-text">
              <RiskBadge level="medium" size="lg" />
              <div className="mt-3">
                <p className="text-sm font-semibold text-ink-primary">Moderate Deficit / Rain Watch</p>
                <p className="text-xs text-ink-secondary mt-1">
                  Upcoming heavy rainfall forecast within 48h. Application held or split to prevent leaching.
                </p>
              </div>
            </Card>

            <Card className="border-l-4 border-l-risk-high-text">
              <RiskBadge level="high" size="lg" />
              <div className="mt-3">
                <p className="text-sm font-semibold text-ink-primary">Severe Over-Application</p>
                <p className="text-xs text-ink-secondary mt-1">
                  Planned dose exceeds nitrogen capacity by 45%. High danger of leaf burn, groundwater contamination, and wasted expenditure.
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* 3. Form Inputs & FormField */}
        <section className="space-y-6">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="text-2xl font-bold text-ink-primary">3. Form Controls & Validation</h2>
            <p className="text-sm text-ink-secondary">
              Input, Select, and Textarea with integrated FormField (labels, hints, and accessible aria-described error states).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="space-y-5">
              <CardTitle as="h3" className="text-base">Standard & Icon Form Fields</CardTitle>
              <FormField
                id="crop-search"
                label="Search Crop Variety"
                hint="Type to find recommended seed types"
              >
                <Input placeholder="e.g. Wheat HD-2967" leftIcon={Search} />
              </FormField>

              <FormField
                id="soil-ph"
                label="Soil pH Level"
                required
                hint="Optimal range is 6.5 to 7.5"
              >
                <Input type="number" step="0.1" defaultValue="7.2" />
              </FormField>

              <FormField
                id="growth-stage"
                label="Crop Growth Stage"
                required
                hint="Deficit calculations vary dynamically per stage"
              >
                <Select
                  options={[
                    { value: 'basal', label: 'Basal / Sowing' },
                    { value: 'vegetative', label: 'Vegetative Growth (Tillering)' },
                    { value: 'flowering', label: 'Flowering / Panicle' },
                    { value: 'maturity', label: 'Maturity' },
                  ]}
                  defaultValue="vegetative"
                />
              </FormField>
            </Card>

            <Card className="space-y-5">
              <CardTitle as="h3" className="text-base">Validation & Disabled States</CardTitle>
              <FormField
                id="nitrogen-input"
                label="Available Soil Nitrogen (N)"
                required
                error="Value must be between 10 and 600 kg/ha. Please recheck your soil health card."
              >
                <Input defaultValue="950" />
              </FormField>

              <FormField
                id="field-notes"
                label="Field Agronomy Notes"
                hint="Optional observations about waterlogging or pest pressures"
              >
                <Textarea placeholder="Enter any specific observations..." rows={3} />
              </FormField>

              <FormField
                id="disabled-field"
                label="Calculated Soil Organic Carbon (%)"
                hint="Locked from soil test record #ST-4089"
              >
                <Input disabled defaultValue="0.54% (Medium)" />
              </FormField>
            </Card>
          </div>
        </section>

        {/* 4. Badges, Cards & Skeletons */}
        <section className="space-y-6">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="text-2xl font-bold text-ink-primary">4. Badges, Feedback & Loading States</h2>
            <p className="text-sm text-ink-secondary">
              Pill badges, accessible Skeleton loading pulses, and Toast notifications with dismissal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle as="h3">Composite Field Card</CardTitle>
                  <Badge variant="primary" icon={Wheat}>Kharif 2026</Badge>
                </div>
                <CardDescription>
                  Demonstrates composable CardHeader, CardTitle, CardDescription, CardContent, and CardFooter.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">
                      Status Badges
                    </p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="neutral">Draft Record</Badge>
                      <Badge variant="success" icon={ShieldCheck}>Verified Soil Test</Badge>
                      <Badge variant="warning">Rain Delay</Badge>
                      <Badge variant="danger">Overdose Alert</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">
                      Loading Skeletons
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Skeleton variant="circle" width="36px" height="36px" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton variant="text" width="60%" />
                          <Skeleton variant="text" width="90%" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <span className="text-xs text-ink-muted">Last updated 2 hours ago</span>
                <Button variant="secondary" size="sm">Quick View</Button>
              </CardFooter>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle as="h3" className="text-base">Toast Notifications</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={RotateCcw}
                  onClick={() => setShowToasts({ success: true, warning: true, error: true, info: true })}
                >
                  Reset Toasts
                </Button>
              </div>

              <div className="space-y-3">
                {showToasts.success && (
                  <Toast
                    variant="success"
                    title="Recommendation Generated"
                    message="Calculated 45 kg/acre Urea with 2-split schedule."
                    onClose={() => setShowToasts((t) => ({ ...t, success: false }))}
                  />
                )}
                {showToasts.warning && (
                  <Toast
                    variant="warning"
                    title="Weather Advisory"
                    message="Heavy rain forecast in 36h. Postpone top-dressing."
                    onClose={() => setShowToasts((t) => ({ ...t, warning: false }))}
                  />
                )}
                {showToasts.error && (
                  <Toast
                    variant="error"
                    title="Invalid Nutrient Ratio"
                    message="Soil test indicates critical phosphorus deficiency."
                    onClose={() => setShowToasts((t) => ({ ...t, error: false }))}
                  />
                )}
              </div>
            </Card>
          </div>
        </section>

        {/* 5. Modal & Empty State */}
        <section className="space-y-6">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="text-2xl font-bold text-ink-primary">5. Dialog Modal & Empty States</h2>
            <p className="text-sm text-ink-secondary">
              Accessible modal dialogs with escape listener, backdrop blur, and contextual empty states.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <Card className="space-y-4">
              <CardTitle as="h3" className="text-base">Interactive Modal Dialog</CardTitle>
              <p className="text-sm text-ink-secondary">
                Click below to launch an accessible modal dialog. Features backdrop dismissal, Escape key handling, and 44px close target.
              </p>
              <div>
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                  Open Test Modal
                </Button>
              </div>
            </Card>

            <EmptyState
              title="No Soil Tests Recorded"
              description="Upload your official Soil Health Card (SHC) or enter laboratory values to generate an optimized fertilizer schedule."
              action={
                <Button variant="primary" leftIcon={Plus}>
                  Add First Soil Test
                </Button>
              }
              secondaryAction={
                <Button variant="outline">
                  Import Sample Data
                </Button>
              }
            />
          </div>
        </section>

        {/* Modal Instance */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Confirm Fertilizer Schedule"
          description="Are you sure you want to commit this fertilizer application schedule to your field records?"
        >
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-lg bg-bg-subtle border border-border-subtle text-sm space-y-1.5">
              <div className="flex justify-between text-ink-secondary">
                <span>Field:</span>
                <span className="font-semibold text-ink-primary">North Khet (Plot 04)</span>
              </div>
              <div className="flex justify-between text-ink-secondary">
                <span>Total Nitrogen Required:</span>
                <span className="font-semibold text-primary-700">62 kg / ha</span>
              </div>
              <div className="flex justify-between text-ink-secondary">
                <span>Estimated Cost Savings:</span>
                <span className="font-semibold text-risk-low-text">₹ 1,240 / acre</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                Confirm & Save
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
