'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-800 mb-1">
            An unexpected error occurred
          </p>
          <p className="text-xs text-red-600 mb-4">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={this.handleRetry}
            className="border border-red-200 hover:border-red-400 px-4 py-2
              text-sm text-red-700 hover:text-red-900 transition-all duration-300"
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
