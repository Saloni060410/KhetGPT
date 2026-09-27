import { Component } from 'react'
import { AlertOctagon, RotateCcw, Home } from 'lucide-react'
import Button from '../ui/Button.jsx'

export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch() {
    // Error caught by boundary
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 bg-bg-surface border border-risk-high-border rounded-2xl shadow-md text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-risk-high-bg text-risk-high-text flex items-center justify-center mx-auto">
              <AlertOctagon className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h2 className="text-xl font-bold text-ink-primary">
              Something went wrong on this page
            </h2>
            <p className="text-sm text-ink-secondary max-w-sm mx-auto">
              {this.state.error?.message ||
                'An unexpected error occurred while rendering this view.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                leftIcon={RotateCcw}
                onClick={this.handleReset}
              >
                Reload View
              </Button>
              <a href="/dashboard">
                <Button variant="primary" size="md" leftIcon={Home}>
                  Go to Dashboard
                </Button>
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
