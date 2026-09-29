import { Component } from 'react'
import ServerError from '../../pages/ServerError.jsx'

export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('RouteErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <ServerError
          error={this.state.error}
          resetErrorBoundary={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

